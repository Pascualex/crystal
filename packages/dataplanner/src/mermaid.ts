/*
 * This file contains all our utilities for dealing with Mermaid-js
 */

import type { OperationPlan } from ".";
import type { ExecutableStep } from "./step.js";
import { __ItemStep, __ListTransformStep } from "./steps/index.js";
import { stripAnsi } from "./stripAnsi.js";

/**
 * An array of hex colour codes that we use for colouring the buckets/steps in
 * the mermaid-js plan diagram.
 *
 * Generated by mokole.com/palette.html; re-ordered by Jem
 */
export const COLORS = [
  "#696969",
  "#00bfff",
  "#7f007f",
  "#ffa500",
  "#0000ff",
  "#7fff00",
  "#ff1493",
  "#808000",
  "#dda0dd",
  "#ff0000",
  "#ffff00",
  "#00ffff",
  "#4169e1",
  "#3cb371",
  "#a52a2a",
  "#ff00ff",
  "#f5deb3",
];

/**
 * Given a string, escapes the string so that it can be embedded as the description of a node in a mermaid chart.
 *
 * 1. If it's already safe, returns it verbatim
 * 2. If it contains disallowed characters, escape them by replacing them with similar-looking characters,
 * 3. Wrap the string in quote marks.
 *
 * @remarks
 *
 * NOTE: rather than doing literal escapes, we replace with lookalike characters because:
 *
 * 1. Mermaid has a bug when calculating the width of the node that doesn't respect escapes,
 * 2. It's easier to read the raw mermaid markup with substitutes rather than messy escapes.
 *
 * @internal
 */
export const mermaidEscape = (str: string): string => {
  if (str.match(/^[a-z0-9 ]+$/i)) {
    return str;
  }
  // Technically we should replace with escapes like this:
  //.replace(/[#"]/g, (l) => ({ "#": "#35;", '"': "#quot;" }[l as any]))
  // However there's a bug in Mermaid's rendering that causes the node to use
  // the escaped string as the width for the node rather than the unescaped
  // string. Thus we replace with similar looking characters.
  return `"${stripAnsi(str.trim())
    .replace(
      /[#"<>]/g,
      (l) => ({ "#": "ꖛ", '"': "”", "<": "ᐸ", ">": "ᐳ" }[l as any]),
    )
    .replace(/\r?\n/g, "<br />")}"`;
};

export interface PrintPlanGraphOptions {
  printPathRelations?: boolean;
  includePaths?: boolean;
  concise?: boolean;
}

/**
 * Convert an OpPlan into a plan graph; call this via `operationPlan.printPlanGraph()`
 * rather than calling this function directly.
 *
 * @internal
 */
export function printPlanGraph(
  operationPlan: OperationPlan,
  {
    // printPathRelations = false,
    includePaths = true,
    concise = false,
  }: PrintPlanGraphOptions,
  {
    steps,
  }: {
    steps: OperationPlan["steps"];
  },
): string {
  const color = (i: number) => {
    return COLORS[i % COLORS.length];
  };

  const planStyle = `fill:#fff,stroke-width:3px,color:#000`;
  const itemplanStyle = `fill:#fff,stroke-width:6px,color:#000`;
  const sideeffectplanStyle = `fill:#f00,stroke-width:6px,color:#000`;
  const graph = [
    `${concise ? "flowchart" : "graph"} TD`,
    `    classDef path fill:#eee,stroke:#000,color:#000`,
    `    classDef plan ${planStyle}`,
    `    classDef itemplan ${itemplanStyle}`,
    `    classDef sideeffectplan ${sideeffectplanStyle}`,
    `    classDef bucket fill:#f6f6f6,color:#000,stroke-width:6px,text-align:left`,
    ``,
  ];

  const squish = (str: string, start = 8, end = 8): string => {
    if (str.length > start + end + 4) {
      return `${str.slice(0, start)}...${str.slice(str.length - end)}`;
    }
    return str;
  };

  const planIdMap = Object.create(null);
  const planId = (plan: ExecutableStep): string => {
    if (!planIdMap[plan.id]) {
      const planName = plan.constructor.name.replace(/Step$/, "");
      const planNode = `${planName}${plan.id}`;
      planIdMap[plan.id] = planNode;
      const rawMeta = plan.toStringMeta();
      const strippedMeta = rawMeta != null ? stripAnsi(rawMeta) : null;
      const meta =
        concise && strippedMeta ? squish(strippedMeta) : strippedMeta;

      const planString = `${planName}[${plan.id}${`∈${plan.layerPlan.id}`}]${
        meta ? `\n<${meta}>` : ""
      }\n${[...plan.polymorphicPaths].map((p) => `-> ${p}`).join("\n")}`;
      const [lBrace, rBrace] =
        plan instanceof __ItemStep
          ? [">", "]"]
          : plan.isSyncAndSafe
          ? ["[", "]"]
          : ["[[", "]]"];
      const planClass = plan.hasSideEffects
        ? "sideeffectplan"
        : plan instanceof __ItemStep
        ? "itemplan"
        : "plan";
      graph.push(
        `    ${planNode}${lBrace}${mermaidEscape(
          planString,
        )}${rBrace}:::${planClass}`,
      );
    }
    return planIdMap[plan.id];
  };

  /*
  const pathIdMap = Object.create(null);
  const pathCounter = 0;
  const pathId = (pathIdentity: string, isItemStep = false): string => {
    if (!pathIdMap[pathIdentity]) {
      pathIdMap[pathIdentity] = `P${++pathCounter}`;
      const [lBrace, rBrace] = isItemStep
        ? [">", "]"]
        : operationPlan.fieldDigestByPathIdentity[pathIdentity]?.listDepth > 0
        ? ["[/", "\\]"]
        : operationPlan.fieldDigestByPathIdentity[pathIdentity]?.isLeaf
        ? ["([", "])"]
        : ["{{", "}}"];
      graph.push(
        `    ${pathIdMap[pathIdentity]}${lBrace}${mermaidEscape(
          crystalPrintPathIdentity(pathIdentity, 2, 3),
        )}${rBrace}:::path`,
      );
    }
    return pathIdMap[pathIdentity];
  };
    graph.push("    %% subgraph fields");
    {
      const recurse = (parent: FieldDigest) => {
        let parentId = pathId(parent.pathIdentity);
        if (parent.itemPathIdentity !== parent.pathIdentity) {
          const newParentId = pathId(parent.itemPathIdentity, true);
          graph.push(`    ${parentId} -.- ${newParentId}`);
          parentId = newParentId;
        }
        if (parent.childFieldDigests) {
          for (const child of parent.childFieldDigests) {
            recurse(child);
            const childId = pathId(child.pathIdentity);
            if (printPathRelations) {
              graph.push(
                `    ${
                  printPathRelations ? "" : "%% "
                }${parentId} -.-> ${childId}`,
              );
            }
          }
        }
      };
      recurse(operationPlan.rootFieldDigest!);
    }
    graph.push("    %% end");
    */

  graph.push("");
  graph.push("    %% define steps");
  operationPlan.processSteps(
    "printingPlans",
    0,
    "dependencies-first",
    (plan) => {
      planId(plan);
      return plan;
    },
  );

  graph.push("");
  graph.push("    %% plan dependencies");
  const chainByDep: { [depNode: string]: string } = {};
  operationPlan.processSteps(
    "printingPlanDeps",
    0,
    "dependencies-first",
    (plan) => {
      const planNode = planId(plan);
      const depNodes = plan.dependencies.map((depId) => {
        return planId(steps[depId]);
      });
      const transformItemPlanNode = null;
      // TODO: bucket steps need to be factored in here.
      /*
      plan instanceof __ListTransformStep
        ? planId(
            steps[operationPlan.transformDependencyPlanIdByTransformStepId[plan.id]],
          )
        : null;
        */
      if (depNodes.length > 0) {
        if (plan instanceof __ItemStep) {
          const [firstDep, ...rest] = depNodes;
          const arrow = plan.transformStepId == null ? "==>" : "-.->";
          graph.push(`    ${firstDep} ${arrow} ${planNode}`);
          if (rest.length > 0) {
            graph.push(`    ${rest.join(" & ")} --> ${planNode}`);
          }
        } else {
          if (
            concise &&
            plan.dependentPlans.length === 0 &&
            depNodes.length === 1
          ) {
            // Try alternating the nodes so they render closer together
            const depNode = depNodes[0];
            if (chainByDep[depNode] === undefined) {
              graph.push(`    ${depNode} --> ${planNode}`);
            } else {
              graph.push(`    ${chainByDep[depNode]} o--o ${planNode}`);
            }
            chainByDep[depNode] = planNode;
          } else {
            graph.push(`    ${depNodes.join(" & ")} --> ${planNode}`);
          }
        }
      }
      if (transformItemPlanNode) {
        graph.push(`    ${transformItemPlanNode} -.-> ${planNode}`);
      }
      return plan;
    },
  );

  if (includePaths) {
    graph.push("");
    graph.push("    %% plan-to-path relationships");
    // TODO: what should this be now?
    /*
    {
      for (const [pathStepId, pathIdentities] of Object.entries(
        pathIdentitiesByStepId,
      )) {
        const crystalPathIdentities = pathIdentities.reduce(
          (memo, pathIdentity) => {
            const crystalPathIdentity = crystalPrintPathIdentity(pathIdentity);
            if (!memo[crystalPathIdentity]) {
              memo[crystalPathIdentity] = 0;
            }
            memo[crystalPathIdentity]++;
            return memo;
          },
          Object.create(null) as {
            [crystalPrintPathIdentity: string]: number;
          },
        );
        const text = Object.entries(crystalPathIdentities)
          .sort((a, z) => z[1] - a[1])
          .map(([id, count]) => `${id}${count > 1 ? ` x${count}` : ""}`)
          .join("\n");
        const pathNode = `P${pathStepId}`;
        graph.push(`    ${pathNode}[${mermaidEscape(text)}]`);
        graph.push(`    ${planId(steps[pathStepId])} -.-> ${pathNode}`);
      }
    }
    */
  }
  /*
    {
      const recurse = (parent: FieldDigest) => {
        const parentId = pathId(parent.pathIdentity);
        graph.push(`    ${planId(steps[parent.planId])} -.-> ${parentId}`);
        if (parent.pathIdentity !== parent.itemPathIdentity) {
          const itemId = pathId(parent.itemPathIdentity);
          graph.push(
            `    ${planId(steps[parent.itemStepId])} -.-> ${itemId}`,
          );
        }
        if (parent.childFieldDigests) {
          for (const child of parent.childFieldDigests) {
            recurse(child);
          }
        }
      };
      recurse(operationPlan.rootFieldDigest!);
    }
    */

  graph.push("");
  graph.push("    subgraph Buckets");
  for (let i = 0, l = operationPlan.layerPlans.length; i < l; i++) {
    const layerPlan = operationPlan.layerPlans[i];
    if (layerPlan.id !== i) {
      continue;
    }
    const plansAndIds = Object.entries(steps).filter(
      ([id, plan]) =>
        plan && plan.id === Number(id) && plan.layerPlan === layerPlan,
    );
    const raisonDEtre =
      layerPlan.reason.type +
      (layerPlan.reason.type === "polymorphic"
        ? `(${layerPlan.reason.typeNames})`
        : ``);
    const outputMapStuff: string[] = [];
    /*
    const processObject = (
      obj: { [fieldName: string]: BucketDefinitionFieldOutputMap },
      path = "⠀⠀",
    ): void => {
      for (const fieldName in obj) {
        const def = obj[fieldName];
        const planIds = Object.values(def.planIdByRootPathIdentity);
        const allIdsSame = planIds.every((id) => id === planIds[0]);
        const planSource = allIdsSame
          ? planIds[0].replace(/^_/, "")
          : JSON.stringify(def.planIdByRootPathIdentity);
        outputMapStuff.push(
          `${path}${fieldName} <-${def.modeType}- ${planSource}`,
        );
        if (def.children) {
          processObject(
            def.children,
            `⠀${concise ? path.replace(/[^⠀]/g, "") : path + fieldName}.`,
          );
        }
      }
    };
    processObject(layerPlan.outputMap);
    */
    graph.push(
      `    Bucket${layerPlan.id}(${mermaidEscape(
        `Bucket ${layerPlan.id}\n(${raisonDEtre})${
          layerPlan.copyPlanIds.length > 0
            ? `\nDeps: ${layerPlan.copyPlanIds
                .map((pId) => steps[pId].id)
                .join(", ")}\n`
            : ""
        }${
          layerPlan.rootStepId != null && layerPlan.reason.type !== "root"
            ? `\nROOT ${operationPlan.dangerouslyGetStep(layerPlan.rootStepId)}`
            : ""
        }\n${[...layerPlan.polymorphicPaths]
          .map((p) => `-> ${p}`)
          .join("\n")}\n${outputMapStuff.join("\n")}`,
      )}):::bucket`,
    );
    graph.push(
      `    classDef bucket${layerPlan.id} stroke:${color(layerPlan.id)}`,
    );
    graph.push(
      `    class ${[
        `Bucket${layerPlan.id}`,
        ...plansAndIds.map(([, plan]) => planId(plan)),
      ].join(",")} bucket${layerPlan.id}`,
    );
  }
  for (let i = 0, l = operationPlan.layerPlans.length; i < l; i++) {
    const layerPlan = operationPlan.layerPlans[i];
    if (layerPlan.id !== i) {
      continue;
    }
    const childNodes = layerPlan.children.map((c) => `Bucket${c.id}`);
    if (childNodes.length > 0) {
      graph.push(`    Bucket${layerPlan.id} --> ${childNodes.join(" & ")}`);
    }
  }
  graph.push("    end");

  const graphString = graph.join("\n");
  return graphString;
}
