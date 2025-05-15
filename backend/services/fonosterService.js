import dotenv from "dotenv";
import * as Fonoster from "@fonoster/sdk"; // Using namespace import for clarity

dotenv.config();

// --- Central Fonoster Client Initialization ---
// This is a critical step. Ensure FONOSTER_ACCESS_KEY_ID is in your .env file.
// Depending on your Fonoster setup (Fonoster Cloud, self-hosted),
// you might also need FONOSTER_ACCESS_KEY_SECRET and/or FONOSTER_ENDPOINT.
// Please refer to the official Fonoster documentation for client configuration.

let fonosterClient; // Holds the main Fonoster client instance

try {
  // Check if the essential environment variable is present
  if (!process.env.FONOSTER_ACCESS_KEY_ID) {
    throw new Error(
      "FONOSTER_ACCESS_KEY_ID is not defined in your .env file. This is required to initialize the Fonoster Client."
    );
  }

  fonosterClient = new Fonoster.Client({
    accessKeyId: process.env.FONOSTER_ACCESS_KEY_ID,
    // accessKeySecret: process.env.FONOSTER_ACCESS_KEY_SECRET, // Uncomment if you use API key secret
    // endpoint: process.env.FONOSTER_ENDPOINT, // Uncomment and set if using a self-hosted Fonoster or non-default endpoint
  });

  // Optional: Login for certain Fonoster setups (e.g., local deployments or specific auth schemes)
  // If you use username/password for a local instance:
  // await fonosterClient.login('your_fonoster_username', 'your_fonoster_password');
  // Or if you use a dedicated API Key ID and Secret for login (distinct from accessKeyId for client init):
  // await fonosterClient.loginWithApiKey(process.env.FONOSTER_API_KEY_ID, process.env.FONOSTER_API_KEY_SECRET);
  console.log("✅ Fonoster Client initialized successfully.");

} catch (error) {
  console.error("❌ Fatal Error: Could not initialize Fonoster Client.");
  console.error("   Message:", error.message);
  console.error(
    "   Troubleshooting: Ensure FONOSTER_ACCESS_KEY_ID (and potentially FONOSTER_ACCESS_KEY_SECRET or FONOSTER_ENDPOINT) are correctly set in your .env file."
  );
  // Depending on your application's error handling strategy, you might want to:
  // 1. Rethrow the error to be caught by a higher-level handler: throw error;
  // 2. Exit the process if the client is essential for the app to run: process.exit(1);
  // For this example, we'll allow the script to continue so functions can show they depend on the client.
}

// --- Fonoster Service Clients ---
// These clients are instantiated using the central fonosterClient.
// This pattern ensures they share the same configuration and authentication.

// It's good practice to check if fonosterClient was initialized before creating service clients.
const messagingClient = fonosterClient
  ? new Fonoster.SMS(fonosterClient) // Pass the client instance
  : null;
const voiceClient = fonosterClient
  ? new Fonoster.Calls(fonosterClient) // Changed from Fonoster.Call to Fonoster.Calls and pass client
  : null;

if (!messagingClient) {
  console.warn("⚠️ Fonoster SMS client could not be initialized because the main Fonoster Client failed to initialize.");
}
if (!voiceClient) {
  console.warn("⚠️ Fonoster Voice client could not be initialized because the main Fonoster Client failed to initialize.");
}

/**
 * Sends an SMS message using the Fonoster SDK.
 * @param {string} to The recipient's phone number (e.g., "+15551234567").
 * @param {string} message The text message content.
 * @returns {Promise<object>} The response object from the Fonoster API upon successful sending.
 * @throws {Error} If the messaging client is not initialized, required parameters are missing, or the API call fails.
 */
export async function sendSMS(to, message) {
  // Pre-condition checks
  if (!messagingClient) {
    const err = new Error(
      "Fonoster Messaging client is not initialized. Cannot send SMS. Check Fonoster Client setup."
    );
    console.error("❌ Error in sendSMS:", err.message);
    throw err;
  }
  if (!process.env.FONOSTER_NUMBER) {
    const err = new Error(
      "FONOSTER_NUMBER environment variable is not set. This is required as the 'from' number."
    );
    console.error("❌ Error in sendSMS:", err.message);
    throw err;
  }
  if (!to) {
    const err = new Error("Recipient 'to' number is required for sending SMS.");
    console.error("❌ Error in sendSMS:", err.message);
    throw err;
  }
  if (typeof message !== 'string') { // Also check if message is a string
    const err = new Error("'message' must be a string.");
    console.error("❌ Error in sendSMS:", err.message);
    throw err;
  }

  try {
    // API call to send SMS
    const response = await messagingClient.sendSMS({
      from: process.env.FONOSTER_NUMBER, // Your Fonoster number
      to, // Recipient's number
      text: message, // Message content
    });
    console.log("✅ SMS sent successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error sending SMS via Fonoster API:", error.message);
    // Log additional details if available (e.g., from API error response)
    if (error.response && error.response.data) {
      console.error("   API Error Details:", error.response.data);
    }
    throw error; // Re-throw the error to be handled by the caller
  }
}

/**
 * Initiates a voice call using the Fonoster SDK.
 * @param {string} to The recipient's phone number or SIP URI (e.g., "+15551234567" or "sip:user@domain.com").
 * @param {string} appRef The reference ID of the Fonoster Application that will handle the call logic.
 * @param {string} [from] The caller ID to display (defaults to FONOSTER_NUMBER from .env).
 * @returns {Promise<object>} The response object from the Fonoster API upon successful call initiation.
 * @throws {Error} If the voice client is not initialized, required parameters are missing, or the API call fails.
 */
export async function makeCall(to, appRef, from = process.env.FONOSTER_NUMBER) {
  // Pre-condition checks
  if (!voiceClient) {
    const err = new Error(
      "Fonoster Voice client is not initialized. Cannot make call. Check Fonoster Client setup."
    );
    console.error("❌ Error in makeCall:", err.message);
    throw err;
  }
  if (!from) {
    const err = new Error(
      "Caller ID ('from' number) is not set. Ensure FONOSTER_NUMBER is in .env or 'from' is explicitly provided."
    );
    console.error("❌ Error in makeCall:", err.message);
    throw err;
  }
  if (!to) {
    const err = new Error("Recipient 'to' number or URI is required for making a call.");
    console.error("❌ Error in makeCall:", err.message);
    throw err;
  }
  if (!appRef) {
    const err = new Error(
      "'appRef' (Application Reference ID) is required to specify which Fonoster Application handles the call."
    );
    console.error("❌ Error in makeCall:", err.message);
    throw err;
  }

  try {
    // API call to create/initiate a call
    // Note the change from .call() to .createCall() and 'app' to 'appRef'
    const response = await voiceClient.createCall({
      from, // Caller ID
      to, // Recipient
      appRef, // Fonoster Application reference to handle the call
      // You can add other options here as per Fonoster SDK documentation, e.g.,
      // webhook: "URL_TO_RECEIVE_CALL_EVENTS", // If your appRef doesn't implicitly define it
      // metadata: { custom_data: "any_value" } // To pass custom data to your voice application
    });
    console.log("📞 Voice call initiated successfully:", response);
    return response;
  } catch (error) {
    console.error("❌ Error making call via Fonoster API:", error.message);
    if (error.response && error.response.data) {
      console.error("   API Error Details:", error.response.data);
    }
    throw error; // Re-throw the error
  }
}

// --- Example Usage (Illustrative) ---
// To run these examples, you would typically call them from another part of your application.
// Ensure your .env file is configured with:
// FONOSTER_ACCESS_KEY_ID=your_access_key_id
// FONOSTER_NUMBER=your_fonoster_phone_number
// FONOSTER_TEST_TO_NUMBER=a_phone_number_to_receive_test_sms_and_calls
// FONOSTER_TEST_APP_REF=your_fonoster_application_reference_id_for_calls

/*
async function runFonosterExamples() {
  // Guard clause: Do not run examples if the client isn't initialized.
  if (!fonosterClient) {
    console.warn(
      "⚠️ Fonoster client is not initialized. Skipping example execution."
    );
    return;
  }

  const testToNumber = process.env.FONOSTER_TEST_TO_NUMBER;
  const testAppRef = process.env.FONOSTER_TEST_APP_REF;

  // Example: Send an SMS
  if (testToNumber) {
    try {
      console.log(`\n--- Attempting to send test SMS to ${testToNumber}... ---`);
      await sendSMS(
        testToNumber,
        "Hello from your updated Fonoster SDK script! This is a test SMS."
      );
    } catch (error) {
      console.error("SMS Example Failed:", error.message);
    }
  } else {
    console.warn(
      "⚠️ FONOSTER_TEST_TO_NUMBER not set in .env. Skipping SMS example."
    );
  }

  // Example: Make a Call
  if (testToNumber && testAppRef) {
    try {
      console.log(
        `\n--- Attempting to make test call to ${testToNumber} using AppRef ${testAppRef}... ---`
      );
      await makeCall(testToNumber, testAppRef);
    } catch (error) {
      console.error("Call Example Failed:", error.message);
    }
  } else {
    console.warn(
      "⚠️ FONOSTER_TEST_TO_NUMBER or FONOSTER_TEST_APP_REF not set in .env. Skipping call example."
    );
  }
}

// To actually run the examples if this script is executed directly:
// (Make sure to handle the async nature if run at the top level of a module)
// if (require.main === module) { // Check if the script is run directly
//   runFonosterExamples().catch(e => console.error("Unhandled error in example runner:", e));
// }
*/
