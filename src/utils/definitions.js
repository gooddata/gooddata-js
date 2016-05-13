import { difference, map } from 'lodash';

const IDENTIFIER_REGEX = /{\S+}/g;

function getDependencies({ metricDefinition }) {
    return (metricDefinition.expression.match(IDENTIFIER_REGEX) || [])
        .map(s => s.substring(1, s.length - 1));
}

function getIdentifier({ metricDefinition }) {
    return metricDefinition.identifier;
}

function resolvedDependencies(resolved, { dependencies }) {
    const identifiers = map(resolved, 'identifier');

    return difference(dependencies, identifiers).length === 0;
}

function sort(unresolved) {
    const resolved = [];

    while (unresolved.length !== 0) {
        const tested = unresolved.shift();

        if (resolvedDependencies(resolved, tested)) {
            resolved.push(tested);
        } else {
            unresolved.push(tested);
        }
    }

    return resolved;
}

export function sortDefinitions(definitions) {
    const indexed = definitions.map(definition => ({
        definition,
        identifier: getIdentifier(definition),
        dependencies: getDependencies(definition)
    }));

    return map(sort(indexed), 'definition');
}
