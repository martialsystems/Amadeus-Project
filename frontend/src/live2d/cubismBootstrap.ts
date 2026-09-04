import {
  CubismFramework,
  LogLevel,
  Option,
} from "@framework/live2dcubismframework";

let initialized = false;

export function initializeCubism(): void {
  if (initialized) {
    return;
  }

  const option = new Option();

  option.logFunction = (message: string) => {
    console.log(`[Cubism] ${message}`);
  };

  option.loggingLevel = LogLevel.LogLevel_Info;

  CubismFramework.startUp(option);
  CubismFramework.initialize();

  initialized = true;

  console.log("Cubism Framework initialized");
}