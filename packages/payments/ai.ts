import { StripeAgentToolkit } from "@stripe/agent-toolkit/ai-sdk";
import { keys } from "./keys";

const { STRIPE_SECRET_KEY } = keys();

export const paymentsAgentToolkit = STRIPE_SECRET_KEY
  ? new StripeAgentToolkit({
      secretKey: STRIPE_SECRET_KEY,
      configuration: {
        // Stripe agent-toolkit types lag the supported configuration shape
        actions: {
          paymentLinks: {
            create: true,
          },
          products: {
            create: true,
          },
          prices: {
            create: true,
          },
        },
      } as ConstructorParameters<typeof StripeAgentToolkit>[0]["configuration"],
    })
  : undefined;
