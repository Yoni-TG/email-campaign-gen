import { CreativeSeedForm } from "@/modules/campaigns/components/creative-seed-form";
import { WizardChrome } from "@/modules/campaigns/components/wizard/wizard-chrome";

export default function NewCampaignPage() {
  return (
    <>
      <WizardChrome title="New campaign" currentStep={1} />
      <CreativeSeedForm />
    </>
  );
}
