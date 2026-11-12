import { gameFonts } from "@/components/mi-club/game-fonts";
import { BodingoScreen } from "@/components/mi-club/screens/bodingo-screen";

export default function Page() {
  return (
    <div className={gameFonts}>
      <BodingoScreen />
    </div>
  );
}
