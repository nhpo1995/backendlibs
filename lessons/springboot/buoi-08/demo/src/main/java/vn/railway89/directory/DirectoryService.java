package vn.railway89.directory;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
class DirectoryService {
    private static final Sort BY_ID = Sort.by("id");

    private final UserRepository users;
    private final GroupRepository groups;
    private final MembershipRepository memberships;

    DirectoryService(UserRepository users, GroupRepository groups, MembershipRepository memberships) {
        this.users = users;
        this.groups = groups;
        this.memberships = memberships;
    }

    @Transactional(readOnly = true)
    public List<UserView> listUsers(String username, String firstName, String lastName, Integer age) {
        return users.findAll((root, query, cb) -> {
            List<Predicate> filters = new ArrayList<>();
            if (hasText(username)) filters.add(contains(cb, root.get("username"), username));
            if (hasText(firstName)) filters.add(contains(cb, root.get("firstName"), firstName));
            if (hasText(lastName)) filters.add(contains(cb, root.get("lastName"), lastName));
            if (age != null) filters.add(cb.equal(root.get("age"), age));
            return cb.and(filters.toArray(Predicate[]::new));
        }, BY_ID).stream().map(UserView::of).toList();
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private static Predicate contains(CriteriaBuilder cb, Expression<String> field, String value) {
        String literal = value.strip().toLowerCase(Locale.ROOT)
                .replace("!", "!!").replace("%", "!%").replace("_", "!_");
        return cb.like(cb.lower(field), "%" + literal + "%", '!');
    }

    @Transactional(readOnly = true)
    public UserView getUser(long id) {
        return UserView.of(requireUser(id));
    }

    @Transactional
    public UserView createUser(String username, String firstName, String lastName, int age) {
        DirectoryUser user = new DirectoryUser();
        user.update(username, firstName, lastName, age);
        return UserView.of(users.save(user));
    }

    @Transactional
    public UserView updateUser(long id, String username, String firstName, String lastName, int age) {
        DirectoryUser user = requireUser(id);
        user.update(username, firstName, lastName, age);
        return UserView.of(user);
    }

    @Transactional
    public void deleteUser(long id) {
        users.delete(requireUser(id));
    }

    @Transactional(readOnly = true)
    public List<GroupView> listGroups() {
        return groups.findAll(BY_ID).stream().map(GroupView::of).toList();
    }

    @Transactional(readOnly = true)
    public GroupView getGroup(long id) {
        return GroupView.of(requireGroup(id));
    }

    @Transactional
    public GroupView createGroup(String name) {
        DirectoryGroup group = new DirectoryGroup();
        group.name = name;
        return GroupView.of(groups.save(group));
    }

    @Transactional
    public GroupView updateGroup(long id, String name) {
        DirectoryGroup group = requireGroup(id);
        group.name = name;
        return GroupView.of(group);
    }

    @Transactional
    public void deleteGroup(long id) {
        groups.delete(requireGroup(id));
    }

    @Transactional(readOnly = true)
    public List<UserView> listMembers(long groupId) {
        requireGroup(groupId);
        return memberships.findUsers(groupId).stream().map(UserView::of).toList();
    }

    @Transactional
    public void addMember(long groupId, long userId) {
        DirectoryGroup group = lockGroup(groupId);
        DirectoryUser user = requireUser(userId);
        if (!memberships.existsByGroup_IdAndUser_Id(groupId, userId)) {
            memberships.save(new Membership(user, group));
        }
    }

    @Transactional
    public void removeMember(long groupId, long userId) {
        lockGroup(groupId);
        memberships.deleteByGroup_IdAndUser_Id(groupId, userId);
    }

    private DirectoryUser requireUser(long id) {
        return users.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy user"));
    }

    private DirectoryGroup requireGroup(long id) {
        return groups.findById(id).orElseThrow(DirectoryService::missingGroup);
    }

    private DirectoryGroup lockGroup(long id) {
        return groups.findForMembershipChange(id).orElseThrow(DirectoryService::missingGroup);
    }

    private static ResponseStatusException missingGroup() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy group");
    }

    record UserView(Long id, String username, String firstName, String lastName, int age) {
        static UserView of(DirectoryUser user) {
            return new UserView(user.id, user.username, user.firstName, user.lastName, user.age);
        }
    }

    record GroupView(Long id, String name) {
        static GroupView of(DirectoryGroup group) {
            return new GroupView(group.id, group.name);
        }
    }
}
