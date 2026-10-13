import test from "node:test";
import assert from "node:assert/strict";
import { MockTest } from "../src/types";
import {
  saveCanonicalTest,
  getCanonicalTestBySlug,
  fetchCanonicalTestBySlug,
} from "../src/lib/data/testService";
import {
  getAdminTestBySlug,
  saveAdminTest,
  getAdminTestQuestions,
} from "../src/lib/admin/adminStore";
import { getQuestionsForTest } from "../src/data/question-bank";
import {
  saveTestServerAction,
  getTestBySlugServerAction,
} from "../src/app/actions/testActions";

test("Admin Test Flow & Question Bank Resolution", async (t) => {
  const sampleTest: MockTest = {
    id: "test-testflow-" + Date.now(),
    slug: "cbse-class-10-mathematics-full-syllabus-mock-test-2026-27",
    title: "CBSE Class 10 Mathematics Full Syllabus Mock Test 2026–27",
    categoryId: "cat-cbse-10",
    categoryName: "CBSE Class 10",
    tags: ["Mathematics", "CBSE"],
    targetAudience: "Class 10 CBSE Students",
    description: "Comprehensive mock test for Class 10 Mathematics.",
    questionCount: 20,
    durationMinutes: 90,
    maxMarks: 80,
    difficulty: "Intermediate",
    language: "English",
    priceInPaise: 0,
    isFree: true,
    topics: ["Algebra", "Trigonometry", "Geometry"],
    expectations: ["Authentic board format", "Step-by-step solutions"],
    published: true,
    createdAt: "2026-10-13",
  };

  await t.test("1. Case-insensitive slug matching and canonical resolution", () => {
    saveCanonicalTest(sampleTest);

    const matchLower = getCanonicalTestBySlug("cbse-class-10-mathematics-full-syllabus-mock-test-2026-27");
    assert.ok(matchLower, "Should match exact slug");
    assert.strictEqual(matchLower?.slug, sampleTest.slug);

    const matchMixed = getCanonicalTestBySlug("Cbse-Class-10-Mathematics-Full-Syllabus-Mock-Test-2026-27");
    assert.ok(matchMixed, "Should match mixed-case slug");
    assert.strictEqual(matchMixed?.title, sampleTest.title);
  });

  await t.test("2. getTestBySlugServerAction resolves canonical test", async () => {
    const res = await getTestBySlugServerAction("cbse-class-10-mathematics-full-syllabus-mock-test-2026-27");
    assert.strictEqual(res.success, true);
    assert.ok(res.data);
    assert.strictEqual(res.data?.slug, sampleTest.slug);
  });

  await t.test("3. Question engine generates syllabus questions for new mock test", () => {
    const questions = getQuestionsForTest(sampleTest);
    assert.ok(questions.length > 0, "Should generate questions");
    assert.ok(questions.length >= 10, "Should meet minimum target count");
    
    // Validate question schema
    const firstQ = questions[0];
    assert.ok(firstQ.id, "Question must have ID");
    assert.ok(firstQ.text, "Question must have text");
    assert.strictEqual(firstQ.options.length, 4, "Question must have 4 options");
    assert.ok(["A", "B", "C", "D"].includes(firstQ.correctOptionId), "Must have valid correctOptionId");
    assert.ok(firstQ.marks > 0, "Marks must be positive");
  });

  await t.test("4. Server action saves and revalidates valid payload", async () => {
    const res = await saveTestServerAction(sampleTest);
    assert.strictEqual(res.success, true);
    assert.ok(res.data);
    assert.strictEqual(res.data?.id, sampleTest.id);
  });
});
