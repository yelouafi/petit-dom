import test from "tape";
import { indexOf } from "../src/utils";

test("indexOf", assert => {
  const slong = "happy cat in the black";

  const sshort = "cat in the";
  const index = indexOf(
    slong,
    sshort,
    0,
    slong.length - 1,
    0,
    sshort.length - 1,
    (a, b) => a === b
  );
  assert.strictEqual(index, slong.indexOf(sshort));

  const sshort2 = "cat in the black";
  const index2 = indexOf(
    slong,
    sshort,
    0,
    slong.length - 1,
    0,
    sshort.length - 1,
    (a, b) => a === b
  );
  assert.strictEqual(index2, slong.indexOf(sshort2));

  assert.end();
});