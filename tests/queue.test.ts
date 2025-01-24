import { Queue } from "../src/queue";

describe("Queue", () => {
  let queue: Queue<number>;

  beforeEach(() => {
    queue = new Queue<number>();
  });

  it("should initialize an empty queue", () => {
    expect(queue.isEmpty()).toBe(true);
    expect(queue.size()).toBe(0);
    expect(queue.peek()).toBeUndefined();
    expect(queue.asArray()).toEqual([]);
  });

  it("should enqueue items into the queue", () => {
    queue.enqueue(1);
    expect(queue.size()).toBe(1);
    expect(queue.asArray()).toEqual([1]);

    queue.enqueue(2);
    expect(queue.size()).toBe(2);
    expect(queue.asArray()).toEqual([1, 2]);
  });

  it("should dequeue items from the queue", () => {
    queue.enqueue(1);
    queue.enqueue(2);

    const dequeued = queue.dequeue();
    expect(dequeued).toBe(1);
    expect(queue.size()).toBe(1);
    expect(queue.peek()).toBe(2);
    expect(queue.asArray()).toEqual([2]);

    const dequeuedAgain = queue.dequeue();
    expect(dequeuedAgain).toBe(2);
    expect(queue.size()).toBe(0);
    expect(queue.isEmpty()).toBe(true);
    expect(queue.peek()).toBeUndefined();
  });

  it("should return undefined when dequeuing an empty queue", () => {
    const dequeued = queue.dequeue();
    expect(dequeued).toBeUndefined();
    expect(queue.isEmpty()).toBe(true);
  });

  it("should return the correct item with peek without removing it", () => {
    queue.enqueue(1);
    queue.enqueue(2);

    const peeked = queue.peek();
    expect(peeked).toBe(1);
    expect(queue.size()).toBe(2);
    expect(queue.asArray()).toEqual([1, 2]);
  });

  it("should handle multiple enqueue and dequeue operations correctly", () => {
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);

    expect(queue.dequeue()).toBe(1);
    expect(queue.dequeue()).toBe(2);
    expect(queue.enqueue(4));
    expect(queue.peek()).toBe(3);
    expect(queue.dequeue()).toBe(3);
    expect(queue.dequeue()).toBe(4);
    expect(queue.isEmpty()).toBe(true);
  });

  it("should return the correct size of the queue", () => {
    expect(queue.size()).toBe(0);

    queue.enqueue(1);
    expect(queue.size()).toBe(1);

    queue.enqueue(2);
    queue.enqueue(3);
    expect(queue.size()).toBe(3);

    queue.dequeue();
    expect(queue.size()).toBe(2);

    queue.dequeue();
    queue.dequeue();
    expect(queue.size()).toBe(0);
  });

  it("should return the queue as an array", () => {
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);

    expect(queue.asArray()).toEqual([1, 2, 3]);

    queue.dequeue();
    expect(queue.asArray()).toEqual([2, 3]);
  });
});