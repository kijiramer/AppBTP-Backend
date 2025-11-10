import React from 'react';
import { Breadcrumb, Dropdown } from 'react-bootstrap';
import { useRouter } from 'next/router';

/**
 * SmartBreadcrumb
 * Props:
 * - levels: Array of { label, path?, active?, items?: [{ label, path }] }
 * Each level becomes a Breadcrumb.Item. If items provided, it renders a Dropdown menu
 * clicking an item navigates to its `path` via next/router.
 */
export default function SmartBreadcrumb({ levels = [] }) {
  const router = useRouter();

  const handleNavigate = (path) => {
    if (!path) return;
    // use router.push for client-side navigation
    router.push(path);
  };

  return (
    <Breadcrumb>
      {levels.map((lvl, idx) => {
        const key = `crumb-${idx}-${lvl.label}`;
        const isLast = idx === levels.length - 1;

        if (lvl.items && lvl.items.length > 0) {
          return (
            <Breadcrumb.Item key={key} active={lvl.active || isLast}>
              <Dropdown>
                <Dropdown.Toggle variant="link" bsPrefix="" style={{ padding: 0 }}>
                  {lvl.label}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  {lvl.items.map((it, i) => (
                    <Dropdown.Item key={i} onClick={() => handleNavigate(it.path)}>
                      {it.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            </Breadcrumb.Item>
          );
        }

        // simple clickable breadcrumb item
        return (
          <Breadcrumb.Item key={key} active={lvl.active || isLast} onClick={() => !lvl.active && lvl.path && handleNavigate(lvl.path)} style={{ cursor: lvl.path ? 'pointer' : 'default' }}>
            {lvl.label}
          </Breadcrumb.Item>
        );
      })}
    </Breadcrumb>
  );
}
