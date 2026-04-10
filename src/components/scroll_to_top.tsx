import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { usePlayerStore } from "../stores/player_store";

export function ScrollToTop() {
  const { pathname } = useLocation();
  const stop = usePlayerStore((s) => s.stop);

  useEffect(() => {
    window.scrollTo(0, 0);
    stop();
  }, [pathname, stop]);

  return null;
}
