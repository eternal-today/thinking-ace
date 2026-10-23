// 문제 만들기(generators.js)의 타입 — 시제품 코드라 느슨하게 둠
export const GEN2: Record<string, (step: number) => any>;
export const R: { pick<T>(a: T[]): T; shuffle<T>(a: T[]): T[]; int(a: number, b: number): number; [k: string]: any };
export function J(word: string, a: string, b: string): string;
export const PAINT: string[];
export const SUDO_SYM: any[];
export function tname(t: any): string;
export function tokHTML(t: any, ...rest: any[]): string;
export function twentySolve(q: any, upto: number): string;
export function genArrow(step: number): any;
export function wrapRule(key: string, q: any): any;
export function sudoCount(p: number[], limit: number): number;
export function sudokuHTML(cells: number[], opt: any): string;
export function paintGridHTML(q: any, cells: any[], opt: any): string;
