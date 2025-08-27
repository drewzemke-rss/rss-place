import { z } from "zod";

export const PlaceMessageSchema = z.object({
	user: z.string(),
	color: z.object({
		r: z.number().min(0).max(255),
		g: z.number().min(0).max(255),
		b: z.number().min(0).max(255),
	}),
	loc: z.object({
		row: z.number().int().min(0),
		col: z.number().int().min(0),
	}),
});

export type PlaceMessage = z.infer<typeof PlaceMessageSchema>;