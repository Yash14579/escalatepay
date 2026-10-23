/**
 * Bridge presets that both the server and the browser can read.
 * Kept free of server imports so the form can use them too.
 */
export const BRIDGE_PRESETS = {
  sms_gateway: {
    kind: "sms" as const,
    label: "SMS through your Android phone",
    endpoint: "https://api.sms-gate.app/3rdparty/v1/messages",
    needs: "The username and password shown in the SMS Gateway app on your phone.",
    doc: "https://docs.sms-gate.app/getting-started/public-cloud-server/",
  },
  waha: {
    kind: "whatsapp" as const,
    label: "WhatsApp through WAHA",
    endpoint: "",
    needs:
      "Your WAHA address (for example https://your-tunnel.trycloudflare.com) and its API key.",
    doc: "https://waha.devlike.pro/docs/how-to/send-messages/",
  },
} as const;
