import {
  DEPARTMENTS_BY_ENTITY,
  ENTITIES,
  getUniversityStructureCounts,
  isBranchUnit,
  isCenterEntity,
  isCollegeEntity,
} from "@/lib/entities";
import {
  EntitiesPageClient,
  type EntityGroupView,
} from "./_components/EntitiesPageClient";

function buildGroups(predicate: (name: string) => boolean): EntityGroupView[] {
  return ENTITIES.filter(predicate).map((name) => {
    const units = DEPARTMENTS_BY_ENTITY[name] ?? [];
    const departments: string[] = [];
    const branches: string[] = [];
    for (const unit of units) {
      if (isBranchUnit(unit, name)) branches.push(unit);
      else departments.push(unit);
    }
    return { name, departments, branches };
  });
}

export default function AdminEntitiesPage() {
  const structure = getUniversityStructureCounts();
  const colleges = buildGroups(isCollegeEntity);
  const centers = buildGroups(isCenterEntity);
  const others = ENTITIES.filter(
    (name) => !isCollegeEntity(name) && !isCenterEntity(name)
  );

  return (
    <EntitiesPageClient
      data={{
        structure,
        colleges,
        centers,
        others,
      }}
    />
  );
}
