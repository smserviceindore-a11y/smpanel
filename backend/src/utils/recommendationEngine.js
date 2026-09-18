const getRecommendations = (requirement, projects) => {
  const hasFilters = Boolean(
    requirement?.industry ||
      requirement?.projectType ||
      requirement?.budget ||
      (requirement?.modules && requirement.modules.length) ||
      requirement?.needsERP ||
      requirement?.needsAI ||
      requirement?.needsMobile
  );

  const scores = projects.map((project) => {
    let score = 0;

    if (
      requirement?.industry &&
      project.industry?.toLowerCase() === requirement.industry.toLowerCase()
    ) {
      score += 30;
    }

    if (
      requirement?.projectType &&
      project.projectType?.toLowerCase() === requirement.projectType.toLowerCase()
    ) {
      score += 25;
    }

    if (requirement.modules?.length && project.features?.length) {
      const reqModules = requirement.modules.map((m) => m.toLowerCase());
      const projectFeatures = project.features.map((f) => f.toLowerCase());
      const overlap = reqModules.filter((m) =>
        projectFeatures.some((f) => f.includes(m) || m.includes(f))
      ).length;
      score += overlap * 10;
    }

    if (requirement.needsERP && project.projectType?.toLowerCase() === 'erp') score += 15;
    if (requirement.needsAI && project.category?.name?.toLowerCase().includes('ai')) score += 15;
    if (
      requirement.needsMobile &&
      project.technologies?.some(
        (t) => t.toLowerCase().includes('react native') || t.toLowerCase().includes('flutter')
      )
    ) {
      score += 10;
    }

    // Baseline so home "Suggested for you" is never empty when no filters
    if (!hasFilters) {
      if (project.featured || project.status === 'featured') score += 40;
      if (project.buyNowEnabled) score += 15;
      score += Math.min(20, Math.round((Number(project.ratingAvg) || 0) * 4));
      score += Math.min(10, Math.round((Number(project.ratingCount) || 0) / 2));
      score += 5; // every published project gets a floor
    }

    return {
      projectId: project._id,
      matchScore: Math.min(score, 99),
    };
  });

  return scores
    .filter((s) => s.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 12);
};

module.exports = { getRecommendations };
