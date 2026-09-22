import { Code2 } from "lucide-react";
import type { IconType } from "react-icons";

import {
  SiC,
  SiClojure,
  SiCplusplus,
  SiCrystal,
  SiCss,
  SiDart,
  SiDocker,
  SiElixir,
  SiErlang,
  SiFsharp,
  SiGnubash,
  SiGo,
  SiGraphql,
  SiHaskell,
  SiHtml5,
  SiJavascript,
  SiJson,
  SiJupyter,
  SiKotlin,
  SiLua,
  SiMarkdown,
  SiMysql,
  SiNim,
  SiNixos,
  SiPhp,
  SiPostgresql,
  SiPython,
  SiR,
  SiRuby,
  SiRust,
  SiScala,
  SiShell,
  SiSolidity,
  SiSwift,
  SiTypescript,
  SiV,
  SiWebassembly,
  SiYaml,
  SiZig,
} from "react-icons/si";

import { cn } from "@/lib/utils";

type LanguageConfig = {
  Icon: IconType;
  bg: string;
  iconClass: string;
};

const LANGUAGE_MAP: Record<string, LanguageConfig> = {
  JavaScript: {
    Icon: SiJavascript,
    bg: "bg-[#F7DF1E]",
    iconClass: "text-[#323330]",
  },

  TypeScript: {
    Icon: SiTypescript,
    bg: "bg-[#3178C6]",
    iconClass: "text-white",
  },

  Python: {
    Icon: Code2,
    bg: "bg-[#3776AB]",
    iconClass: "text-white",
  },
};