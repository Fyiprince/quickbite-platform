import { motion } from "framer-motion";
import { Bike, Home, Store } from "lucide-react";
import { useMemo } from "react";

interface LatLng {
  lat: number;
  lng: number;
}

/**
 * A schematic route visualization (no external map tiles required):
 * pickup → drop drawn on a stylized grid, with the delivery marker smoothly
 * interpolated from the partner's latest GPS ping. Drop-in upgrade path to
 * Mapbox GL when a token is available.
 */
export function RouteMap({
  from,
  to,
  partner,
  etaMins,
}: {
  from: LatLng;
  to: LatLng;
  partner: LatLng | null;
  etaMins?: number;
}) {
  const W = 480;
  const H = 300;
  const PAD = 42;

  const { fromPt, toPt, path, markerT } = useMemo(() => {
    const lngSpan = Math.max(Math.abs(to.lng - from.lng), 0.001);
    const latSpan = Math.max(Math.abs(to.lat - from.lat), 0.001);
    const minLng = Math.min(from.lng, to.lng);
    const maxLng = Math.max(from.lng, to.lng);
    const minLat = Math.min(from.lat, to.lat);
    const maxLat = Math.max(from.lat, to.lat);

    const x = (lng: number) => PAD + ((lng - minLng) / lngSpan) * (W - 2 * PAD);
    const y = (lat: number) => H - PAD - ((lat - minLat) / latSpan) * (H - 2 * PAD);

    const fp = { x: x(from.lng), y: y(from.lat) };
    const tp = { x: x(to.lng), y: y(to.lat) };

    // S-curve between pickup and drop
    const midX = (fp.x + tp.x) / 2;
    const bulge = 46;
    const path = `M ${fp.x} ${fp.y} C ${midX} ${fp.y - bulge}, ${midX} ${tp.y + bulge}, ${tp.x} ${tp.y}`;

    // Project partner position onto the pickup→drop axis for a stable marker
    let t = 0;
    if (partner) {
      const dx = tp.x - fp.x;
      const dy = tp.y - fp.y;
      const lenSq = dx * dx + dy * dy || 1;
      t = ((partner.lng - from.lng) * dx + (partner.lat - from.lat) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
    }
    return { fromPt: fp, toPt: tp, path, markerT: t };
  }, [from, to, partner]);

  const marker = useMemo(() => {
    // sample the cubic bezier at markerT
    const p0 = fromPt;
    const p3 = toPt;
    const p1 = { x: (fromPt.x + toPt.x) / 2, y: fromPt.y - 46 };
    const p2 = { x: (fromPt.x + toPt.x) / 2, y: toPt.y + 46 };
    const t = markerT;
    const mt = 1 - t;
    const x = mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x;
    const y = mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y;
    return { x, y };
  }, [fromPt, toPt, markerT]);

  const etaText =
    etaMins !== undefined
      ? etaMins <= 1
        ? "Arriving now"
        : `Arriving in ~${etaMins} min`
      : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-[#eef3ea] dark:bg-[#16211c]">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-full w-full">
        {/* stylized blocks */}
        <defs>
          <pattern id="qb-grid" width="34" height="34" patternUnits="userSpaceOnUse">
            <path d="M 34 0 L 0 0 0 34" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
          </pattern>
          <linearGradient id="qb-road" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#16a34a" stopOpacity="0.12" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#qb-grid)" className="text-foreground" />

        {/* a couple of decorative "roads" */}
        <path d={`M -20 ${H * 0.62} H ${W + 20}`} stroke="currentColor" strokeOpacity="0.07" strokeWidth="26" />
        <path d={`M ${W * 0.3} -20 V ${H + 20}`} stroke="currentColor" strokeOpacity="0.06" strokeWidth="18" />

        {/* route */}
        <path d={path} fill="none" stroke="url(#qb-road)" strokeWidth="16" strokeLinecap="round" opacity="0.6" />
        <path
          d={path}
          fill="none"
          stroke="#f97316"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 10"
          strokeLinejoin="round"
        />
        <motion.path
          d={path}
          fill="none"
          stroke="#16a34a"
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: markerT }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* pins */}
        <g transform={`translate(${fromPt.x} ${fromPt.y})`}>
          <circle r="18" fill="#f97316" opacity="0.15" />
          <g transform="translate(-12 -26)">
            <rect width="24" height="24" rx="7" fill="#f97316" />
            <Store className="size-3.5 text-white" x="5" y="5" />
          </g>
        </g>
        <g transform={`translate(${toPt.x} ${toPt.y})`}>
          <circle r="18" fill="#16a34a" opacity="0.15" />
          <g transform="translate(-12 -26)">
            <rect width="24" height="24" rx="7" fill="#16a34a" />
            <Home className="size-3.5 text-white" x="5" y="5" />
          </g>
        </g>

        {/* live marker */}
        {partner && (
          <motion.g
            initial={false}
            animate={{ x: marker.x, y: marker.y }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <circle r="16" fill="#1d4ed8" opacity="0.18">
              <animate attributeName="r" values="10;20;10" dur="2s" repeatCount="indefinite" />
            </circle>
            <g transform="translate(-12 -26)">
              <rect width="24" height="24" rx="8" fill="#1d4ed8" stroke="#fff" strokeWidth="2" />
              <Bike className="size-4 text-white" x="4" y="4" />
            </g>
          </motion.g>
        )}
      </svg>

      {/* labels */}
      <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur dark:bg-black/50">
          <span className="size-1.5 rounded-full bg-[#f97316]" /> Pickup
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur dark:bg-black/50">
          <span className="size-1.5 rounded-full bg-[#16a34a]" /> Drop
        </div>
      </div>

      {etaText && partner && (
        <motion.div
          key={etaText}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="absolute bottom-3 right-3 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg"
        >
          {etaText}
        </motion.div>
      )}
    </div>
  );
}
