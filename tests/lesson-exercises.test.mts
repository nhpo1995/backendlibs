import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareCode } from '../frontend/src/codeComparison.ts';

const course = JSON.parse(readFileSync(new URL('../content/springboot/course.json', import.meta.url), 'utf8'));

for (const slug of ['bean-registration', 'api-errors', 'dynamic-query', 'security-authentication']) {
  test(`${slug}: reference contains the whole starter context`, () => {
    const lab = course.lessons.find((lesson: any) => lesson.slug === slug).lab;
    assert.equal(lab.comparison ?? 'whole', 'whole');
    const retained = {
      'bean-registration': ['class Invitations', 'InvitationService invitationService(', 'return new InvitationService(selected);'],
      'api-errors': ['@RestControllerAdvice', 'class ApiErrors'],
      'dynamic-query': ['List<Predicate> predicates = new ArrayList<>();'],
      'security-authentication': ['PasswordEncoder encoder = new BCryptPasswordEncoder();', 'String hash = encoder.encode("demo-pass");'],
    }[slug]!;
    for (const text of retained) assert(lab.solution.includes(text), `${slug}: missing ${text}`);
    assert.equal(compareCode({actual: lab.solution, expected: lab.solution, language: lab.language}).kind, 'match');
  });
}

test('validation reference implements the controller validation requested by the starter', () => {
  const lab = course.lessons.find((lesson: any) => lesson.slug === 'bean-validation').lab;
  assert.match(lab.starter, /@PostMapping/);
  assert.match(lab.solution.replace(/\/\/[^\n]*/g, ''), /@Valid\s+@RequestBody Registration request/);
});

const completions: Record<string, (starter: string) => string> = {
  'bean-registration': starter => starter
    .replace('/* TODO: chọn kênh email */', '@EmailChannel'),
  'api-errors': starter => starter.replace('// TODO: handler cho GroupNotFound', `@ExceptionHandler(GroupNotFound.class)
    ProblemDetail missing(GroupNotFound ex) {
        var problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "Group không tồn tại");
        problem.setProperty("code", "GROUP_NOT_FOUND");
        return problem;
    }`),
  'dynamic-query': starter => starter.replace('// TODO: minPrice chỉ tạo predicate khi không null', 'if (minPrice != null) { predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice)); }'),
  'security-authentication': starter => starter.replace('// TODO: kiểm tra đúng và sai mật khẩu', 'boolean accepted = encoder.matches("demo-pass", hash);\nboolean rejected = encoder.matches("wrong", hash);'),
  'bean-validation': starter => starter
    .replace('String username,', '@NotBlank @Size(min = 3, max = 20) String username,')
    .replace('String email', '@NotBlank @Email String email')
    .replace('/* TODO: kích hoạt validation */', '@Valid'),
};
for (const [slug, complete] of Object.entries(completions)) {
  test(`${slug}: filling TODO while keeping starter context matches`, () => {
    const lab = course.lessons.find((lesson: {slug: string}) => lesson.slug === slug).lab;
    const actual = complete(lab.starter);
    assert.equal(compareCode({actual, expected:lab.solution, language:lab.language, starter:lab.starter, mode:lab.comparison}).kind, 'match');
    assert.notEqual(compareCode({actual:actual + '\nthrow new IllegalStateException();', expected:lab.solution, language:lab.language, mode:lab.comparison}).kind, 'match');
  });
}

for (const lesson of course.lessons) {
  test(`${lesson.slug}: exercise has explicit editing guidance and starter cannot pass`, () => {
    const lab = lesson.lab;
    assert(lab.instructions?.trim(), 'Missing instructions about what to keep/replace');
    assert(!lab.starter.includes('throw new UnsupportedOperationException'), 'Executable placeholder in starter');
    const actual = compareCode({actual:lab.starter, expected:lab.solution, language:lab.language, starter:lab.starter, mode:lab.comparison});
    const reference = compareCode({actual:lab.solution, expected:lab.solution, language:lab.language, starter:lab.starter, mode:lab.comparison});
    if (lab.comparison === 'manual') {
      assert.equal(actual.kind, 'manual');
      assert.equal(reference.kind, 'manual');
    } else {
      assert.notEqual(actual.kind, 'match', 'Unchanged starter is accepted');
      assert.equal(reference.kind, 'match', 'Reference cannot be compared');
    }
  });
}
