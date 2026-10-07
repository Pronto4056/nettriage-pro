import { useState } from 'react';

const relationships = [
  {
    id: 'host',
    title: 'Host',
    label: 'Interface address',
    meaning:
      'The host address describes an interface. An address alone does not establish connectivity.',
  },
  {
    id: 'subnet',
    title: 'Subnet',
    label: 'Calculated boundary',
    meaning:
      'The subnet mask defines network boundaries. Compare addresses mathematically, rather than matching the first three octets.',
  },
  {
    id: 'gateway',
    title: 'Gateway',
    label: 'Next-hop relationship',
    meaning:
      'Gateway membership is a configuration relationship. Reachability and explicit on-link routes require separate evidence.',
  },
] as const;

export function ConfigurationMap() {
  const [selected, setSelected] =
    useState<(typeof relationships)[number]['id']>('host');
  const active = relationships.find((item) => item.id === selected)!;
  return (
    <section
      className="network-art"
      aria-label="Conceptual configuration relationships"
    >
      <div className="art-caption">CONFIGURATION RELATIONSHIPS</div>
      <div className="relationship-row">
        {relationships.map((item, index) => (
          <div className="relationship-step" key={item.id}>
            {index > 0 && (
              <span className="connector" aria-hidden="true">
                {index === 1 ? '→ prefix' : '→ next hop'}
              </span>
            )}
            <button
              className="node"
              aria-pressed={selected === item.id}
              aria-controls="relationship-explanation"
              onClick={() => setSelected(item.id)}
            >
              {item.title}
              <span>{item.label}</span>
            </button>
          </div>
        ))}
      </div>
      <p
        id="relationship-explanation"
        className="relationship-explanation"
        aria-live="polite"
      >
        <b>{active.title}.</b> {active.meaning}
      </p>
    </section>
  );
}
