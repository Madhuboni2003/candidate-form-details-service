import { VslStepChannel } from '../utils/enums/VslStepChannel';
import { VslStepKey } from '../utils/enums/VslStepKey';

// One step of the chain: what it is, on which day it is due and how it reaches its target.
export type VslPlanStep = {
    key: VslStepKey
    // days after the candidate submitted the details popup (that moment is Day 0)
    dayNumber: number
    channel: VslStepChannel
};

// The whole VSL abandonment chain, in the order the steps are due.
// Whether one "day" lasts 24 hours or 1 minute is decided by VSL_STEP_UNIT_MINUTES in the config.
export const VSL_PLAN: VslPlanStep[] = [
    { key: VslStepKey.VSL_D1_EMAIL, dayNumber: 1, channel: VslStepChannel.EMAIL },
    { key: VslStepKey.VSL_D3_EMAIL, dayNumber: 3, channel: VslStepChannel.EMAIL },
    { key: VslStepKey.VSL_D4_TASK, dayNumber: 4, channel: VslStepChannel.INTERNAL },
    { key: VslStepKey.VSL_D7_EMAIL, dayNumber: 7, channel: VslStepChannel.EMAIL }
];