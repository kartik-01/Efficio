import * as React from "react";

const RemoteA = React.lazy(() => import("remote_a/Widget"));
const RemoteB = React.lazy(() => import("remote_b/Widget"));
const RemoteC = React.lazy(() => import("remote_c/Widget"));

export function Routes() {
  return (
    <React.Suspense fallback={<div className="p-6">Loading…</div>}>
      <div className="p-6 space-y-6">
        <RemoteA />
        <RemoteB />
        <RemoteC />
      </div>
    </React.Suspense>
  );
}
