// DEPRECATED — V2 onboarding split this screen into separate Venues, Days
// and Timings screens. Anyone landing here is redirected to /onboarding/venues.
import { Redirect } from "expo-router";

export default function PreferencesRedirect() {
  return <Redirect href="/onboarding/venues" />;
}
