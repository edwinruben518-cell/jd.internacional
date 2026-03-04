export type UserPlan = 'NONE' | 'BASIC' | 'PRO' | 'ELITE'

export const PLAN_LIMITS = {
    NONE: {
        bots: 0,
        productsPerUser: 0,
        stores: 0,
        ads: false,
        landingPages: false,
    },
    BASIC: {
        bots: 1,
        productsPerUser: 2,
        stores: 1,
        ads: false,
        landingPages: false,
    },
    PRO: {
        bots: 2,
        productsPerUser: 20,
        stores: Infinity,
        ads: true,
        landingPages: true,
    },
    ELITE: {
        bots: Infinity,
        productsPerUser: Infinity,
        stores: Infinity,
        ads: true,
        landingPages: true,
    },
} as const

export const PLAN_NAMES: Record<UserPlan, string> = {
    NONE: 'Sin Plan',
    BASIC: 'Pack Básico',
    PRO: 'Pack Pro',
    ELITE: 'Pack Elite',
}

export function getPlanLimits(plan: UserPlan) {
    return PLAN_LIMITS[plan] ?? PLAN_LIMITS.NONE
}
