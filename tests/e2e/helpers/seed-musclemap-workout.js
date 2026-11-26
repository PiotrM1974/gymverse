export async function seedMuscleMapWorkout(page) {
  await page.addInitScript(() => {
    let plans;
    try { plans = JSON.parse(localStorage.getItem('gymverse_plans') || '[]'); } catch { plans = []; }
    if (!Array.isArray(plans)) plans = [];
    if (!plans.some(plan => plan.id === 'push_a1')) {
      plans.unshift({
        id: 'push_a1',
        title: 'Push A1',
        exercises: [
          { key: 'bench_flat', sets: 2, target: '8-12' },
          { key: 'db_incline', sets: 2, target: '8-12' },
          { key: 'shoulder_press', sets: 2, target: '8-12' },
          { key: 'lat_raise_stand', sets: 2, target: '8-12' },
          { key: 'tri_rope', sets: 2, target: '8-12' }
        ]
      });
    }
    localStorage.setItem('gymverse_plans', JSON.stringify(plans));
    if (!localStorage.getItem('gymverse_schema')) localStorage.setItem('gymverse_schema', '4');

    let registry;
    try { registry = JSON.parse(localStorage.getItem('gymverse_profiles_v1') || 'null'); } catch { registry = null; }
    if (!registry || !Array.isArray(registry.profiles) || registry.profiles.length === 0) {
      registry = {
        schemaVersion: 1,
        activeProfileId: 'musclemap-test-profile',
        profiles: [{
          id: 'musclemap-test-profile',
          name: 'MuscleMap test',
          attributes: { age: 34, experience: 'beginner', trainingGoal: 'fitness', equipment: ['machines', 'dumbbells', 'bench', 'cables'], restrictions: [] },
          data: {},
          planPrograms: { schemaVersion: 1, assignedProgramId: null, programs: [] }
        }]
      };
    } else if (!registry.profiles.some(profile => profile.id === registry.activeProfileId)) {
      registry.activeProfileId = registry.profiles[0].id;
    }
    localStorage.setItem('gymverse_profiles_v1', JSON.stringify(registry));
  });
}
