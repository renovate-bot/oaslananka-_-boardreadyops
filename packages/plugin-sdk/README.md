# @boardreadyops/plugin-sdk

`@boardreadyops/plugin-sdk` provides the stable plugin contract for BoardReadyOps extensions.

```ts
import { definePlugin } from "@boardreadyops/plugin-sdk";

export default definePlugin({
  name: "boardreadyops-plugin-example",
  version: "1.0.0",
  permissions: ["fs:read"],
  rules: [],
});
```

Plugins run in the same Node.js process as BoardReadyOps. Install and execute plugins only from sources you trust.

Plugins that need filesystem, network, process, or KiCad CLI access should declare `permissions` and document why they are required. Host projects must approve requested permissions with `pluginPermissions` before the plugin rules load.
