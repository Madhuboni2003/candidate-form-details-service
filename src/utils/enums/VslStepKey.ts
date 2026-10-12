// The steps of the VSL follow-up chain. The name tells the day and what happens.
export enum VslStepKey {
    // Day 1: recovery mail ("You checked this yesterday - one thing before you move on")
    VSL_D1_EMAIL = 'VSL_D1_EMAIL',
    // Day 3: approved Abhinay proof mail
    VSL_D3_EMAIL = 'VSL_D3_EMAIL',
    // Day 4: no mail, a follow-up task for the sales team
    VSL_D4_TASK = 'VSL_D4_TASK',
    // Day 7: closing mail ("Should we close this for now?")
    VSL_D7_EMAIL = 'VSL_D7_EMAIL'
}