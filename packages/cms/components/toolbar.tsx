/**
 * BaseHub CMS toolbar — only loads when `BASEHUB_TOKEN` is set.
 * Without the token the component renders nothing, allowing local dev without CMS.
 */
export function Toolbar() {
  if (!process.env.BASEHUB_TOKEN) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy-load so basehub SDK isn't pulled in without a token
  const { Toolbar: BaseHubToolbar } = require("basehub/next-toolbar") as {
    Toolbar: React.ComponentType;
  };

  return <BaseHubToolbar />;
}
