import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { nextPrice, previousPrice, stepAt } from "../priceSteps.js";

describe("price calculator steps", () => {
  it("steps 20 lakhs below ₹5 Cr and ₹1 Cr from ₹5 Cr", () => {
    assert.equal(stepAt(20), 20);
    assert.equal(stepAt(100), 20);
    assert.equal(stepAt(499), 20);
    assert.equal(stepAt(500), 100);
    assert.equal(stepAt(1200), 100);
  });

  it("goes up to the next round step", () => {
    assert.equal(nextPrice(100), 120);
    assert.equal(nextPrice(30), 40);
    assert.equal(nextPrice(480), 500);
    assert.equal(nextPrice(500), 600);
    assert.equal(nextPrice(650), 700);
  });

  it("walks from a base price to ₹7 Cr", () => {
    const prices = [200];
    while (prices.at(-1) < 700) prices.push(nextPrice(prices.at(-1)));
    assert.deepEqual(prices, [200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400, 420, 440, 460, 480, 500, 600, 700]);
  });

  it("goes down by the step below, never under the base price", () => {
    assert.equal(previousPrice(600, 200), 500);
    assert.equal(previousPrice(500, 200), 480);
    assert.equal(previousPrice(650, 200), 600);
    assert.equal(previousPrice(40, 30), 30);
    assert.equal(previousPrice(220, 200), 200);
    assert.equal(previousPrice(200, 200), 200);
    assert.equal(previousPrice(150, 200), 200);
  });
});
