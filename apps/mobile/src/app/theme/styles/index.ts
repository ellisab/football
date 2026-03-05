import { StyleSheet } from "react-native";
import { appTheme } from "../theme";
import type { AppTheme } from "../types";
import { createBracketStyles } from "./bracket";
import { createHomeStyles } from "./home";
import { createLayoutStyles } from "./layout";
import { createMatchdayStyles } from "./matchday";
import { createStandingsStyles } from "./standings";
import { createTeamStyles } from "./teams";

export const createStyles = (theme: AppTheme) =>
  StyleSheet.create({
    ...createLayoutStyles(theme),
    ...createHomeStyles(theme),
    ...createMatchdayStyles(theme),
    ...createTeamStyles(theme),
    ...createStandingsStyles(theme),
    ...createBracketStyles(theme),
  });

export const appStyles = createStyles(appTheme);

export type AppStyles = ReturnType<typeof createStyles>;
