import type {
  MatchBroadcast,
  MatchBroadcastResolution,
} from "@footballleagues/core/broadcasts";
import { Tv } from "lucide-react";

const UNCONFIRMED_BROADCAST_LABEL = "Sender noch nicht bestätigt";

const accessLabel = (broadcast: MatchBroadcast) =>
  broadcast.access === "free" ? "Kostenlos" : "Abo";

const coverageLabel = (broadcast: MatchBroadcast) =>
  broadcast.coverage === "conference" ? "Konferenz" : "Einzelspiel";

const mediumLabel = (broadcast: MatchBroadcast) =>
  broadcast.medium === "stream" ? "Stream" : "TV";

const ownershipLabel = (broadcast: MatchBroadcast) =>
  broadcast.ownership === "public"
    ? "öffentlich-rechtlich"
    : "privater Anbieter";

const fullDetail = (broadcast: MatchBroadcast) =>
  [
    accessLabel(broadcast),
    mediumLabel(broadcast),
    coverageLabel(broadcast),
    ownershipLabel(broadcast),
  ].join(", ");

export const getBroadcastAccessibilityLabel = (
  resolution: MatchBroadcastResolution,
) => {
  if (resolution.status === "unsupported") return "";
  if (resolution.status === "unconfirmed") {
    return `Übertragung: ${UNCONFIRMED_BROADCAST_LABEL}`;
  }

  return `Übertragung: ${resolution.broadcasts
    .map((broadcast) => `${broadcast.name}, ${fullDetail(broadcast)}`)
    .join("; ")}`;
};

function BroadcastChip({ broadcast }: { broadcast: MatchBroadcast }) {
  return (
    <span
      className="featured-match__broadcast-chip"
      data-broadcaster={broadcast.id}
      title={`${broadcast.name}: ${fullDetail(broadcast)}`}
    >
      <strong className="featured-match__broadcast-mark">
        {broadcast.shortName}
      </strong>
    </span>
  );
}

export function BroadcastDock({
  resolution,
}: {
  resolution: MatchBroadcastResolution;
}) {
  if (resolution.status === "unsupported") return null;

  return (
    <div
      className="featured-match__broadcast-dock"
      data-state={resolution.status}
      aria-hidden="true"
    >
      {resolution.status === "unconfirmed" ? (
        <span className="featured-match__broadcast-empty">
          <Tv />
          {UNCONFIRMED_BROADCAST_LABEL}
        </span>
      ) : (
        <>
          <span className="featured-match__broadcast-label">
            <Tv />
          </span>
          <span className="featured-match__broadcast-list">
            {resolution.broadcasts.map((broadcast) => (
              <BroadcastChip
                broadcast={broadcast}
                key={`${broadcast.id}-${broadcast.coverage}`}
              />
            ))}
          </span>
        </>
      )}
    </div>
  );
}
