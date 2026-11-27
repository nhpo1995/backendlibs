import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { compareCode } from '../frontend/src/codeComparison.ts';

const compare = (actual: string, expected: string, language = 'java', starter = '', mode: 'whole' | 'addition' = 'whole') => compareCode({ actual, expected, language, starter, mode });

test('Java ignores indentation, blank lines and comments outside literals', () => {
  assert.equal(compare('class A{\n\n int answer ( ) { /*why*/ return 42 ; }\n}', 'class A { int answer() { return 42; } }').kind, 'match');
});
test('Java keeps identifiers and operators distinct', () => {
  for (const [actual, expected] of [['returnvalue;', 'return value;'], ['a + + b;', 'a++ + b;'], ['a > > b;', 'a >> b;'], ['return 41;', 'return 42;']]) assert.notEqual(compare(actual, expected).kind, 'match');
});
test('Java nested generic formatting matches', () => {
  assert.equal(compare('class A { List < List < String > > x; }', 'class A { List<List<String>> x; }').kind, 'match');
});
test('string and character whitespace and escapes stay meaningful', () => {
  assert.notEqual(compare('String s="ab";', 'String s="a b";').kind, 'match');
  assert.notEqual(compare("char x=' ';", "char x='x';").kind, 'match');
  assert.equal(compare('String s = "http://a/*b*/ c";', 'String s="http://a/*b*/ c";').kind, 'match');
});
test('empty work and checklist-only answers cannot pass', () => {
  assert.equal(compare(' // TODO\n', 'return 1;').kind, 'empty');
  assert.equal(compare('', '// verify the DB').kind, 'manual');
  assert.equal(compare('// verify the DB', '// verify the DB').kind, 'manual');
});
test('unfinished comments do not erase missing code or pass a full answer', () => {
  assert.notEqual(compare('return 1; /* unfinished', 'return 1;').kind, 'match');
});
test('YAML indentation width may vary but hierarchy must stay the same', () => {
  assert.equal(compare('server:\n    port: 8080\n\n# hi\n', 'server:\n  port: 8080', 'yaml').kind, 'match');
  assert.notEqual(compare('server:\nport: 8080', 'server:\n  port: 8080', 'yaml').kind, 'match');
});
test('YAML scalar whitespace is preserved', () => {
  assert.notEqual(compare('message: "ab"', 'message: "a b"', 'yaml').kind, 'match');
});
test('PowerShell ignores blank lines and spacing between arguments', () => {
  assert.equal(compare('  curl.exe    -i   "http://localhost/a"  \n\n# note\n', 'curl.exe -i "http://localhost/a"', 'powershell').kind, 'match');
});
test('PowerShell preserves statement boundaries, literals and command names', () => {
  assert.notEqual(compare('Get-Item a Get-Item b', 'Get-Item a\nGet-Item b', 'powershell').kind, 'match');
  assert.notEqual(compare('Write-Output "ab"', 'Write-Output "a b"', 'powershell').kind, 'match');
  assert.notEqual(compare('Get-Itemx', 'Get-Item x', 'powershell').kind, 'match');
});
test('addition mode accepts unchanged starter plus the requested code, but no extra logic', () => {
  const starter = 'String hash = encoder.encode("demo-pass");\n// TODO';
  const answer = 'boolean ok = encoder.matches("demo-pass", hash);';
  assert.equal(compare(starter + '\n' + answer, answer, 'java', starter, 'addition').kind, 'match');
  assert.notEqual(compare(starter + '\n' + answer + '\nreturn false;', answer, 'java', starter, 'addition').kind, 'match');
  assert.notEqual(compare(starter.replace('demo-pass', 'other') + '\n' + answer, answer, 'java', starter, 'addition').kind, 'match');
});
test('unsupported languages do not silently pass', () => {
  assert.equal(compare('x', 'x', 'unknown').kind, 'unsupported');
});

test('old Java placeholders get guidance without ignoring real statements or strings', () => {
  const result = compare('int x() { return 1; throw new UnsupportedOperationException(); }', 'int x() { return 1; }');
  assert.equal(result.kind, 'different');
  assert.match(result.message, /Xóa dòng/);
  assert.equal(compare('throw new UnsupportedOperationException();', 'throw new UnsupportedOperationException();').kind, 'match');
  assert.doesNotMatch(compare('String text = "throw new UnsupportedOperationException();";', 'return 1;').message, /Xóa dòng/);
});

test('addition mode can fill a method into a starter class without losing its wrapper', () => {
  const starter = '@RestControllerAdvice class ApiErrors { /* TODO */ }';
  const answer = '@ExceptionHandler(NotFound.class) ProblemDetail missing(NotFound ex) { return missing(); }';
  assert.equal(compare(starter.replace('/* TODO */', answer), answer, 'java', starter, 'addition').kind, 'match');
});

test('all existing reference snippets are comparable or explicitly manual', () => {
  const course = JSON.parse(readFileSync(new URL('../content/springboot/course.json', import.meta.url), 'utf8'));
  for (const lesson of course.lessons) {
    const lab = lesson.lab;
    const result = compareCode({ actual: lab.solution, expected: lab.solution, language: lab.language, starter: lab.starter, mode: lab.comparison });
    assert(['match', 'manual'].includes(result.kind), `${lesson.slug}: ${result.kind}`);
  }
});
