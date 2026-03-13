import { describe, it, expect } from "vitest";
import { initialCourses } from "../courses";

describe("courses data", () => {
  it("has at least one course", () => {
    expect(initialCourses.length).toBeGreaterThan(0);
  });

  it("all courses have unique titles", () => {
    const titles = initialCourses.map((c) => c.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("every course has at least one lesson", () => {
    for (const course of initialCourses) {
      expect(
        course.lessons.length,
        `${course.title} should have lessons`
      ).toBeGreaterThan(0);
    }
  });

  it("every course has required fields", () => {
    for (const course of initialCourses) {
      expect(course.title).toBeTruthy();
      expect(course.description).toBeTruthy();
      expect(course.duration).toBeTruthy();
      expect(typeof course.progress).toBe("number");
    }
  });

  it("every lesson has title, duration, and description", () => {
    for (const course of initialCourses) {
      for (const lesson of course.lessons) {
        expect(lesson.title, `lesson in ${course.title}`).toBeTruthy();
        expect(lesson.duration, `lesson in ${course.title}`).toBeTruthy();
        expect(lesson.description, `lesson in ${course.title}`).toBeTruthy();
      }
    }
  });

  it("progress values are between 0 and 100", () => {
    for (const course of initialCourses) {
      expect(course.progress).toBeGreaterThanOrEqual(0);
      expect(course.progress).toBeLessThanOrEqual(100);
    }
  });
});
