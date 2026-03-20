import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface backendInterface {
    getBirthdayMessage(): Promise<string>;
    getTitle(): Promise<string>;
    resetBirthdayMessage(): Promise<void>;
    resetTitle(): Promise<void>;
    setBirthdayMessage(message: string): Promise<void>;
    setTitle(newTitle: string): Promise<void>;
}
