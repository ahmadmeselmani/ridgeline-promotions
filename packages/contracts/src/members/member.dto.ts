import { z } from "zod";
import { MemberSchema } from "./member.schema";

export const MemberResponseSchema = MemberSchema;

export type MemberResponse = z.infer<typeof MemberResponseSchema>;
