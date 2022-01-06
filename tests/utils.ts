import { performance } from "perf_hooks";

type TestFunction = () => void;
type Test = { desc: string; run: CallableFunction };
type RunStats = { passed: number; failed: number; total: number };
type FailedTest = { desc: string; error: Error };

export function test(description: string, fn: TestFunction) {
    return { desc: description, run: fn };
}

export function runTests(...tests: Test[]) {
    const stats: RunStats = { passed: 0, failed: 0, total: tests.length };
    const failures: FailedTest[] = [];
    const startTime = performance.now();
    tests.forEach(({ desc, run }) => {
        try {
            run();
            stats.passed += 1;
        } catch (err) {
            failures.push({ desc, error: err as Error });
            stats.failed += 1;
        }
    });
    const total = performance.now() - startTime;

    console.log("======Test report======");
    console.log("\n");
    console.log(`Ran ${stats.total} test(s) in ${total.toFixed(4)}ms`);
    console.log(`Tests passed: ${stats.passed}`);
    console.log(`Tests failed: ${stats.failed}`);
    console.log("\n\n");

    if (failures.length) {
        process.exitCode = 1;
        console.log("The following tests failed: \n");
    }
    failures.forEach(({ desc, error }) => {
        console.log(desc);
        console.log("-----------------------------");
        console.error(error.message);
        console.error("\n\n\n");
    });
}
