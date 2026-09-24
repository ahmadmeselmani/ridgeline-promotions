import { z } from "zod";
import { MemberSchema } from "./member.schema";

export type Member = z.infer<typeof MemberSchema>;
