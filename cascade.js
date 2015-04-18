var cascade = (function () {
    return {
        cascade: cascade,
        cascadeCopy: cascadeCopy,
        cascadeDelete: cascadeDelete,
        getEntityName: getEntityName,
        getDependentProperties: getDependentProperties,
        getLookupProperties: getLookupProperties,
        getDataProperties: getDataProperties,
        isOptionalDependent: isOptionalDependent,
        ignore: ignore
    };

    function cascade(entity, config) {
        var entityName = getEntityName(entity);
        var entityConfig = config && config[entityName];
        var override = entityConfig && entityConfig.override;
        var pre = (entityConfig && entityConfig.pre) || (config && config.pre);
        var post = entityConfig && entityConfig.post || (config && config.post);

        if (pre) {
            pre(entity);
        }

        getDependentProperties(entity)
            .forEach(function (navigationProperty) {
                var propertyName = navigationProperty.name;
                var overrideProperty = override && override[propertyName];

                if (overrideProperty) {
                    overrideProperty(entity);
                } else if (navigationProperty.isScalar) {
                    thru(entity[propertyName], config);
                } else {
                    entity[propertyName]
                        .forEach(function (dependentEntity) {
                            thru(dependentEntity, config);
                        });
                }
            });

        if (post) {
            post(entity);
        }
    }

    function cascadeCopy(entity, config) {
        config.pre = copyPrinciple;
        config.post = joinDependents;

        thru(entity, config);

        function copyPrinciple(entity) {
            var entityCopy = entity._entityCopy || entity.entityType.createEntity();
            
            entityCopy._original = entity;
            entity._entityCopy = entityCopy;

            // Copy all lookup and non-key data properties
            getLookupProperties(entity)
                .map(function (navigationProperty) {
                    // Copy lookups by key
                    return navigationProperty.relatedDataProperties;
                })
                .reduce(function (acc, dataProperties) {
                    return acc.concat(dataProperties);
                })
                .concat(getDataProperties(entity))
                .forEach(function (dataProperty) {
                    var propertyName = dataProperty.name;

                    entityCopy[propertyName] = entity[propertyName];
                });

            // Initialize optional dependents with id of clone
            getDependentProperties(entity)
                .filter(function (navigationProperty) {
                    return isOptionalDependent(entity[navigationProperty.name]);
                })
                .forEach(function (navigationProperty) {
                    var propertyName = property.name;
                    var dependentEntity = entity[propertyName];

                    if (dependentEntity) {
                        dependentEntity._entityCopy = dependentEntity.entityType.createEntity({ id: entityCopy.id });
                    }
                });
        }

        function joinDependents(entity) {
            var entityCopy = entity && entity._entityCopy;

            if (entityCopy) {
                getDependentProperties(entity)
                    .forEach(function (dependentProperty) {
                        var propertyName = dependentProperty.name;
                        var dependentEntityCopy = entity[propertyName] && entity[propertyName]._entityCopy;

                        entityCopy[propertyName] = dependentEntityCopy;
                    });
            }
        }
    }

    function cascadeDelete(entity, config) {
        config.post = setDeleted;

        cascade(entity, config);

        function setDeleted(entity) {
            entity.entityAspect.setDeleted();
        }
    }

    function getEntityName(entity) {
        return !entity ? '' : entity.entityType.name;
    }

    function getDependentProperties(entity) {
        return !entity ?
            [] :
            entity.entityType.navigationProperties
                .filter(function (navigationProperty) {
                return !navigationProperty.foreignKeyNames.length;
            });
    }

    function getLookupProperties(entity) {
        return !entity ?
            [] :
            entity.entityType.navigationProperties
            .filter(function (navigationProperty) {
                return navigationProperty.foreignKeyNames.length && !navigationProperty.inverse;
            });
    }

    function getDataProperties(entity) {
        return !entity ?
            [] :
            entity.entityType.dataProperties
            .filter(function (dataProperty) {
                return dataProperty.isSettable && !dataProperty.isPartOfKey && !dataProperty.relatedNavigationProperty;
            });
    }

    function isOptionalDependent(entity) {
        return entity && entity.entityType.keyProperties
            .some(function (keyProperty) {
                var parentType = keyProperty.parentType;

                return parentType.shortName === getEntityName(entity) &&
                       parentType.autoGeneratedKeyType &&
                       parentType.keyProperty.parentType.autoGeneratedKeyType.name === 'None';
            });
    }
    
    function ignore() {
        // No Op 
        return;
    }
})();
