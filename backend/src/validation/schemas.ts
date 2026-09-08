import { z } from 'zod';

const isoDateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');
const uuidLike = z.string().min(5);
const optionalStringArray = z.array(z.string().min(1)).optional();

/** Accept JSON arrays, JSON-string arrays (multipart), or comma-separated strings. */
const formStringArray = z.preprocess((val) => {
  if (val == null || val === '') return undefined;
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return undefined;
    if (trimmed.startsWith('[')) {
      try {
        return JSON.parse(trimmed);
      } catch {
        return trimmed;
      }
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return val;
}, optionalStringArray);

export const idParamSchema = z.object({
  params: z.object({
    id: uuidLike,
  }),
});

export const authRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    phone: z.string().min(5).optional(),
  }),
});

export const authLoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  }),
});

export const updateMeSchema = z.object({
  body: z
    .object({
      name: z.string().min(2).optional(),
      phone: z.string().min(5).nullable().optional(),
    })
    .refine((v) => v.name !== undefined || v.phone !== undefined, {
      message: 'At least one of name or phone is required',
    }),
});

export const emptyBodySchema = z.object({
  body: z.object({}).optional(),
});

export const roomTypeCreateSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    basePrice: z.coerce.number().nonnegative(),
    capacity: z.coerce.number().int().min(1),
    amenities: formStringArray,
    /** Pasted image URLs (JSON mode) or multipart field */
    images: formStringArray,
    /** Explicit multipart field for pasted URLs when files also use `images` */
    imageUrls: formStringArray,
    description: z.string().optional(),
  }),
});

export const roomTypeUpdateSchema = z.object({
  params: z.object({ id: uuidLike }),
  body: z.object({
    name: z.string().min(1).optional(),
    basePrice: z.coerce.number().nonnegative().optional(),
    capacity: z.coerce.number().int().min(1).optional(),
    amenities: formStringArray,
    images: formStringArray,
    imageUrls: formStringArray,
    description: z.string().nullable().optional(),
  }),
});

export const roomCreateSchema = z.object({
  body: z.object({
    roomTypeId: uuidLike,
    roomNumber: z.string().min(1),
    floor: z.number().int(),
    status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  }),
});

export const roomUpdateSchema = z.object({
  params: z.object({ id: uuidLike }),
  body: z
    .object({
      roomTypeId: uuidLike.optional(),
      roomNumber: z.string().min(1).optional(),
      floor: z.number().int().optional(),
      status: z.enum(['available', 'occupied', 'maintenance']).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, 'At least one field is required'),
});

export const roomSearchSchema = z.object({
  query: z.object({
    checkIn: isoDateOnly,
    checkOut: isoDateOnly,
    guests: z.coerce.number().int().min(1).optional(),
    type: uuidLike.optional(),
  }),
});

export const bookingCreateSchema = z.object({
  body: z.object({
    roomId: uuidLike,
    checkIn: isoDateOnly,
    checkOut: isoDateOnly,
    guestsCount: z.number().int().min(1),
    promoCode: z.string().min(2).max(32).optional(),
  }),
});

export const bookingWalkInSchema = z.object({
  body: z.object({
    roomId: uuidLike,
    checkIn: isoDateOnly,
    checkOut: isoDateOnly,
    guestsCount: z.number().int().min(1),
    guestName: z.string().min(2),
    guestEmail: z.string().email(),
    guestPhone: z.string().optional(),
    promoCode: z.string().min(2).max(32).optional(),
  }),
});

export const paymentIntentSchema = z.object({
  body: z.object({
    bookingId: uuidLike,
  }),
});

export const reviewCreateSchema = z.object({
  body: z.object({
    roomTypeId: uuidLike,
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(1000).optional(),
  }),
});

export const promoCreateSchema = z.object({
  body: z.object({
    code: z.string().min(2).max(32),
    discountPercent: z.number().int().min(1).max(100),
    validFrom: z.string().datetime(),
    validTo: z.string().datetime(),
    maxUses: z.number().int().min(1),
  }),
});

export const promoValidateSchema = z.object({
  query: z.object({
    code: z.string().min(2).max(32),
  }),
});

export const promoUpdateSchema = z.object({
  params: z.object({ id: uuidLike }),
  body: z
    .object({
      code: z.string().min(2).max(32).optional(),
      discountPercent: z.number().int().min(1).max(100).optional(),
      validFrom: z.string().datetime().optional(),
      validTo: z.string().datetime().optional(),
      maxUses: z.number().int().min(1).optional(),
      usedCount: z.number().int().min(0).optional(),
    })
    .refine((v) => Object.keys(v).length > 0, 'At least one field is required'),
});

export const staffInviteSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    role: z.enum(['staff', 'admin']),
    phone: z.string().optional(),
  }),
});

export const staffAssignRoleSchema = z.object({
  params: z.object({ id: uuidLike }),
  body: z.object({
    role: z.enum(['customer', 'staff', 'admin']),
  }),
});

export const paginationSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
