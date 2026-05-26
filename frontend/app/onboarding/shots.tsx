// DEPRECATED — V2 moved Rate-Your-Shots out of onboarding. Available
// from Profile → Rate Your Shots. Redirect any stale link to OTP step
// instead so users still complete onboarding.
import { Redirect } from "expo-router";

export default function ShotsRedirect() {
  return <Redirect href="/onboarding/otp" />;
}
