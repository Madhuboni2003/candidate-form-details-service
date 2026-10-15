export const VSL_PLAN = [
    {
        key: 'VSL_D1_EMAIL',
        day: 1,
        channel: 'email',
        templateKey: 'EMAIL_IC_VSL_01_MOVE_ON',
        subject: 'You checked this yesterday - one thing before you move on'
    },
    {
        key: 'VSL_D3_EMAIL',
        day: 3,
        channel: 'email',
        templateKey: 'EMAIL_IC_VSL_02_ABHINAY_PROOF',
        subject: "See Abhinay's proof" // Final subject/copy approval pending.
    },
    {
        key: 'VSL_D4_TASK',
        day: 4,
        channel: 'internal' // Sets the priority flag; no notification is sent.
    },
    {
        key: 'VSL_D7_EMAIL',
        day: 7,
        channel: 'email',
        templateKey: 'EMAIL_IC_VSL_03_CLOSE_FOR_NOW',
        subject: 'Should we close this for now?'
    }
] as const;

// Keeps the total sequence length in one place.
export const VSL_PLAN_LENGTH = VSL_PLAN.length;