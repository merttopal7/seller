import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const adSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(150),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(10000),
  price: z.number().min(0, "Price must be positive"),
  currency: z.string().default("USD"),
  location: z.string().min(3, "Location is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().optional(),
  country: z.string().optional().default("Burkina Faso"),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdInput = z.infer<typeof adSchema>;
