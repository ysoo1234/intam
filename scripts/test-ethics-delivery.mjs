import assert from "node:assert/strict";

export function runEthicsDeliveryTests(load) {
  const root = "src/game/features/ethics-review";
  const { ETHICS_REVIEW_CONFIG: config } = load(root + "/model/config.ts");
  const rules = load(root + "/model/rules.ts");
  const state = load(root + "/model/deliveryState.ts");
  const {
    ETHICS_REVIEW_CASES: cases, ETHICS_PRACTICE_CASE: practice, ETHICS_VISITORS: visitors,
    ETHICS_VISITOR_LINES: lines,
  } = load(root + "/content/cases.ts");
  const {
    createEthicsDeliveryState: create, actEthicsDelivery: act, continueEthicsDelivery: next,
    tickEthicsDelivery: tick, getEthicsDeliveryCase: card, getEthicsDeliveryVisitor: visitor,
  } = state;
  assert.equal(config.durationMs, 120_000);
  assert.ok(config.correctionDurationMs > config.feedbackDurationMs, "Mistakes need extra reading time.");
  assert.equal(cases.length, 40);
  assert.equal(new Set(cases.map(item => item.id)).size, cases.length);
  for (const item of [...cases, practice]) {
    assert.equal(item.prompt.split("\n").length, 2, item.id + " needs two short lines.");
    assert.ok(item.prompt.split("\n").every(line => line.length <= 21), item.id + " is too long for the form.");
    assert.ok(item.explanation.length <= 45, item.id + " needs brief feedback.");
  }
  for (const category of ["permission", "privacy", "checking", "honesty", "respect"]) {
    const subset = cases.filter(item => item.category === category);
    assert.equal(subset.length, 8);
    assert.equal(subset.filter(item => item.verdict === "approve").length, 4);
  }
  assert.ok(visitors.length >= 2, "Students take turns at the window.");
  assert.equal(new Set(visitors.map(item => item.id)).size, visitors.length);
  for (const group of Object.values(lines)) {
    assert.ok(group.length > 0);
    assert.ok(group.every(line => line.length <= 12), "Visitor lines must fit the small bubble.");
  }
  const seeded = seed => () => {
    seed = (seed * 1_664_525 + 1_013_904_223) >>> 0;
    return seed / 4_294_967_296;
  };
  const deck = rules.createReviewShift(cases, cases.length, seeded(42));
  assert.deepEqual(deck, rules.createReviewShift(cases, cases.length, seeded(42)));
  assert.equal(new Set(deck.map(item => item.id)).size, 40);
  assert.equal(deck.filter(item => item.verdict === "approve").length, 20);
  assert.equal(rules.createReviewShift(cases, 99).length, 40);
  assert.equal(rules.createReviewShift(cases, -1).length, 0);
  assert.equal(rules.createReviewShift(cases.filter(item => item.verdict === "approve"), 3).length, 3);
  assert.equal(cases[0].id, "photo-permission", "Shuffling must not mutate the source.");
  const decision = rules.evaluateReviewDecision(cases[0], cases[0].verdict);
  assert.equal(decision.correct, true);
  assert.equal(decision.points, 100);
  assert.equal(rules.evaluateReviewDecision(cases[0], cases[0].verdict, 3).points, 130);
  assert.equal(rules.evaluateReviewDecision(cases[0], cases[0].verdict, 99).points, 150);
  assert.equal(rules.getEthicsReviewPoints(true, 0), 100);
  assert.equal(rules.getEthicsReviewPoints(false, 99), 0);
  assert.equal(rules.isEthicsComboCelebration(3), true);
  assert.equal(rules.isEthicsComboCelebration(4), false);
  assert.equal(rules.getEthicsAccuracy(0, 0), 0);
  assert.equal(rules.getEthicsAccuracy(12, 15), 0.8);
  assert.equal(rules.getEthicsReviewStars(0, 0), 1);
  assert.equal(rules.getEthicsReviewStars(5, 5), 1);
  assert.equal(rules.getEthicsReviewStars(6, 10), 2);
  assert.equal(rules.getEthicsReviewStars(12, 15), 3);
  assert.equal(rules.getEthicsReviewStars(12, 16), 2);
  assert.equal(rules.getEthicsReviewStars(50, 100), 1, "Random stamping must not earn extra stars.");
  for (const action of ["approve", "reject"]) {
    assert.equal(rules.canRequestEthicsAction("feedback", action), false);
    assert.equal(rules.canRequestEthicsAction("result", action), false);
    assert.equal(rules.canRequestEthicsAction("choosing", action), true);
  }
  assert.equal(rules.canRequestEthicsAction("choosing", "skip"), false);
  assert.deepEqual(rules.getEthicsVisitorForCase(visitors, 0, true), visitors[0], "Practice always meets the first student.");
  assert.notDeepEqual(rules.getEthicsVisitorForCase(visitors, 0, false), rules.getEthicsVisitorForCase(visitors, 1, false),
    "Consecutive forms come from different students.");
  assert.throws(() => rules.getEthicsVisitorForCase([], 0, false));

  // Practice: untimed, retry on mistake, no score.
  let current = create(deck);
  assert.equal(current.phase, "choosing");
  assert.equal(tick(current, 150_000), current, "Practice is untimed.");
  assert.equal(next(current), current);
  assert.deepEqual(visitor(current), visitors[0]);
  current = act(current, "reject");
  assert.equal(current.decision.correct, false);
  assert.equal(current.decision.points, 0);
  assert.equal(current.mistakeCount, 0);
  assert.equal(current.processedCount, 0, "Practice cannot inflate counts.");
  assert.equal(tick(current, 150_000), current);
  assert.equal(act(current, "approve"), current, "No second stamp during feedback.");
  current = next(current);
  assert.equal(current.phase, "choosing");
  assert.equal(card(current).id, practice.id);
  assert.equal(current.decision, undefined);
  current = act(current, "approve");
  assert.equal(current.decision.correct, true);
  assert.equal(current.decision.points, 0, "Practice never awards points.");
  assert.equal(current.score, 0);
  current = next(current);
  assert.equal(current.practice, false);
  assert.equal(current.phase, "choosing");
  assert.equal(current.remainingMs, config.durationMs);
  const initial = current;

  // Feedback is part of the two-minute clock, with extra reading time on error.
  const expected = card(current).verdict;
  current = tick(current, 400);
  const wrong = expected === "approve" ? "reject" : "approve";
  current = act(current, wrong);
  assert.equal(current.processedCount, 1);
  assert.equal(current.completedCount, 0);
  assert.equal(current.mistakeCount, 1);
  assert.equal(current.score, 0);
  assert.equal(current.combo, 0);
  assert.equal(current.decision.points, 0);
  assert.equal(current[wrong === "approve" ? "approvedCount" : "returnedCount"], 1);
  assert.equal(act(current, expected), current, "No second verdict during feedback.");
  assert.equal(next(current), current, "Space cannot skip timed feedback.");
  assert.equal(current.feedbackMs, config.correctionDurationMs);
  current = tick(current, config.correctionDurationMs - 1);
  assert.equal(current.phase, "feedback");
  assert.equal(current.caseIndex, 0);
  assert.equal(current.remainingMs, config.durationMs - 400 - config.correctionDurationMs + 1);
  current = tick(current, 1);
  assert.equal(current.phase, "choosing");
  assert.equal(current.caseIndex, 1);
  assert.equal(current.decision, undefined);

  // The deck cycles without deadlocking or allowing duplicate scoring.
  let previousVisitor = visitor(current);
  for (let i = 1; i <= 42; i++) {
    assert.equal(card(current), deck[i % deck.length]);
    if (i > 1) assert.notDeepEqual(visitor(current), previousVisitor, "Students alternate at the window.");
    previousVisitor = visitor(current);
    current = act(current, card(current).verdict);
    assert.equal(current.processedCount, i + 1);
    assert.equal(current.completedCount, i);
    assert.equal(current.phase, "feedback");
    assert.equal(current.feedbackMs, config.feedbackDurationMs);
    assert.equal(current.decision.points, rules.getEthicsReviewPoints(true, i - 1));
    assert.equal(act(current, "approve"), current);
    current = tick(current, config.feedbackDurationMs);
  }
  assert.equal(current.phase, "choosing");
  assert.equal(current.bestCombo, 42);
  assert.equal(current.approvedCount + current.returnedCount, current.processedCount);
  assert.equal(current.mistakeCount + current.completedCount, current.processedCount);
  assert.equal(rules.getEthicsReviewStars(current.completedCount, current.processedCount), 3);
  current = tick(current, current.remainingMs - 1);
  assert.equal(current.phase, "choosing");
  assert.equal(current.remainingMs, 1);
  current = tick(current, 1);
  assert.equal(current.phase, "result");
  assert.equal(current.remainingMs, 0);
  assert.equal(tick(current, 999), current);
  assert.equal(act(current, "approve"), current);
  assert.equal(next(current), current);
  assert.equal(tick(initial, -5).remainingMs, initial.remainingMs);
  assert.equal(tick(initial, 60_000).remainingMs, 60_000, "Long elapsed time must not be capped.");
  assert.equal(tick(initial, 120_001).phase, "result");
  for (const verdict of ["approve", "reject"]) {
    const nearDeadline = {...act(initial, verdict), remainingMs: 20};
    assert.equal(tick(nearDeadline, 20).phase, "result", "Deadline applies during either verdict.");
  }
  const restarted = create(deck);
  assert.equal(restarted.practice, true);
  assert.equal(restarted.score, 0);
  assert.equal(restarted.processedCount, 0);
  assert.equal(restarted.remainingMs, config.durationMs);
  const empty = create([]);
  assert.equal(empty.phase, "result");
  assert.equal(next(act(empty, "approve")).phase, "result");
  console.log("Ethics office: 40 balanced cases, alternating visitors, practice retry, continuous 120s, both verdicts, scoring and replay passed.");
}
