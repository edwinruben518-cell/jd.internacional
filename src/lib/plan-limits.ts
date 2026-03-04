export type UserPlan = 'NONE' | 'BASIC' | 'PRO' | 'ELITE'

export const PLAN_LIMITS = {
    NONE: {
        bots: 0,
        productsPerUser: 0,
        stores: 0,
        landingPages: 0,
        ads: false,
        newLaunches: false,
    },
    BASIC: {
        bots: 1,
        productsPerUser: 2,
        stores: 1,
        landingPages: 0,
        ads: false,
        newLaunches: false,
    },
    PRO: {
        bots: 2,
        productsPerUser: 20,
        stores: 2,
        landingPages: 2,
        ads: true,
        newLaunches: false,
    },
    ELITE: {
        bots: Infinity,
        productsPerUser: Infinity,
        stores: Infinity,
        landingPages: Infinity,
        ads: true,
        newLaunches: true,
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
