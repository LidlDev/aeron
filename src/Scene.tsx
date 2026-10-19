import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";
import * as THREE from "three";
import { type Sport, colors } from "./domain";
import { SceneFallback } from "./ui";
type Props = {
  variant: "hero" | "orb" | "terrain" | "journey" | "recovery";
  sport: Sport;
  values: number[];
  value: number;
  reduced: boolean;
};
function Ribbons({ reduced, sport, variant, value }: Omit<Props, "values">) {
  const group = useRef<THREE.Group>(null);
  const geometries = useMemo(
    () =>
      [0, 1, 2].map((i) => {
        const points = [];
        for (let j = 0; j <= 160; j++) {
          const t = (j / 160) * Math.PI * 2;
          const r = 1.25 + 0.13 * Math.sin(t * 3 + i);
          points.push(
            new THREE.Vector3(
              Math.cos(t) * r,
              Math.sin(t) * r,
              Math.sin(t * 2 + i * 2.1) * 0.55,
            ),
          );
        }
        const curve = new THREE.CatmullRomCurve3(points, true);
        const geom = new THREE.TubeGeometry(curve, 160, 0.075, 8, true);
        geom.scale(1, 1, 0.8);
        return geom;
      }),
    [],
  );
  useEffect(() => () => geometries.forEach((g) => g.dispose()), [geometries]);
  useFrame((state, dt) => {
    if (group.current && !reduced) {
      group.current.rotation.y += dt * 0.095;
      group.current.rotation.x = THREE.MathUtils.lerp(
        group.current.rotation.x,
        0.25 + state.pointer.y * 0.15,
        0.025,
      );
      group.current.rotation.z = THREE.MathUtils.lerp(
        group.current.rotation.z,
        -0.35 + state.pointer.x * 0.12,
        0.025,
      );
    }
  });
  return (
    <group ref={group} rotation={[0.3, 0.4, -0.4]}>
      {variant === "recovery" ? (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1, 0.02 + value * 0.012, 16, 100]} />
          <meshStandardMaterial
            color="#72D9AF"
            metalness={0.65}
            roughness={0.28}
          />
        </mesh>
      ) : (
        geometries.map((g, i) => (
          <mesh key={i} geometry={g} rotation={[i * 0.65, i * 0.35, i * 0.85]}>
            <meshStandardMaterial
              color={
                variant === "orb"
                  ? colors[sport]
                  : ["#D6FF43", "#d5ddd2", "#536655"][i]
              }
              metalness={0.85}
              roughness={0.24}
            />
          </mesh>
        ))
      )}
      <mesh>
        <sphereGeometry args={[0.16, 24, 24]} />
        <meshStandardMaterial
          color={colors[sport]}
          emissive={colors[sport]}
          emissiveIntensity={0.35}
          metalness={0.8}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}
function Terrain({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <group rotation={[0, -0.3, 0]} position={[-1.8, -0.7, 0]}>
      {values.map((v, i) => (
        <group key={i} position={[i * 0.34, 0, 0]}>
          <mesh position={[0, (v / max) * 0.8, 0]}>
            <boxGeometry args={[0.23, (v / max) * 1.6, 0.7]} />
            <meshStandardMaterial
              color={i === values.length - 1 ? "#D6FF43" : "#384c31"}
              metalness={0.4}
              roughness={0.55}
            />
          </mesh>
        </group>
      ))}
      <gridHelper
        args={[6, 12, "#293237", "#171D20"]}
        position={[2, -0.01, 0]}
      />
    </group>
  );
}
function Journey() {
  const geoms = useMemo(
    () =>
      [0, 1, 2].map(
        (i) =>
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(
              Array.from({ length: 40 }, (_, j) => {
                const t = ((j / 39 + i) / 3) * Math.PI * 2;
                return new THREE.Vector3(
                  Math.cos(t) * 1.5,
                  Math.sin(t * 2) * 0.35,
                  Math.sin(t),
                );
              }),
            ),
            50,
            0.045,
            8,
            false,
          ),
      ),
    [],
  );
  useEffect(() => () => geoms.forEach((g) => g.dispose()), [geoms]);
  return (
    <group rotation={[0.35, 0.1, -0.2]}>
      {geoms.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial
            color={["#43C7E8", "#D6FF43", "#FF875B"][i]}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
export default function Scene(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [hidden, setHidden] = useState(document.hidden);
  const [systemReduced, setSystemReduced] = useState(
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const change = () => setHidden(document.hidden);
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const motion = () => setSystemReduced(query.matches);
    document.addEventListener("visibilitychange", change);
    query.addEventListener("change", motion);
    return () => {
      document.removeEventListener("visibilitychange", change);
      query.removeEventListener("change", motion);
    };
  }, []);
  const [supported] = useState(() => {
    try {
      const c = document.createElement("canvas");
      const context = c.getContext("webgl2") || c.getContext("webgl");
      context?.getExtension("WEBGL_lose_context")?.loseContext();
      return !!context;
    } catch {
      return false;
    }
  });
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const reduced = props.reduced || systemReduced;
  return (
    <div
      className={`aeron-scene scene-${props.variant}`}
      ref={ref}
      role="img"
      aria-label={
        props.variant === "terrain"
          ? "Interactive training volume terrain. The chart below provides the same data."
          : props.variant === "journey"
            ? "70.3 race journey: 1.9 km swim, 90 km cycle, 21.1 km run."
            : "AERON kinetic endurance sculpture"
      }
    >
      {supported ? (
        <Canvas
          dpr={[1, 1.5]}
          frameloop={!visible || hidden || reduced ? "demand" : "always"}
          camera={{ position: [0, 0, 5.2], fov: 42 }}
          gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
        >
          <ambientLight intensity={1.3} />
          <directionalLight
            position={[4, 5, 5]}
            intensity={5}
            color="#efffd5"
          />
          <directionalLight
            position={[-4, 0, 2]}
            intensity={3}
            color="#839a7d"
          />
          <pointLight position={[0, -3, 1]} intensity={14} color="#D6FF43" />
          {props.variant === "terrain" ? (
            <Terrain values={props.values} />
          ) : props.variant === "journey" ? (
            <Journey />
          ) : (
            <Float
              enabled={!reduced && visible && !hidden}
              speed={1}
              floatIntensity={0.2}
            >
              <Ribbons {...props} reduced={reduced} />
            </Float>
          )}
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate={false}
            enableDamping={!reduced}
          />
        </Canvas>
      ) : (
        <SceneFallback />
      )}
    </div>
  );
}
