package vn.railway89.directory;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

interface UserRepository extends JpaRepository<DirectoryUser, Long>, JpaSpecificationExecutor<DirectoryUser> {}

interface GroupRepository extends JpaRepository<DirectoryGroup, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select g from DirectoryGroup g where g.id = :id")
    Optional<DirectoryGroup> findForMembershipChange(@Param("id") long id);
}

interface MembershipRepository extends JpaRepository<Membership, Long> {
    boolean existsByGroup_IdAndUser_Id(long groupId, long userId);
    void deleteByGroup_IdAndUser_Id(long groupId, long userId);

    @Query("select m.user from Membership m where m.group.id = :groupId order by m.user.id")
    List<DirectoryUser> findUsers(@Param("groupId") long groupId);
}
