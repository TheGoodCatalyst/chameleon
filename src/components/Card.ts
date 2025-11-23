/**
 * Card Component
 */

import { ComponentDefinition, createComponentWrapper } from '../core/component-registry';

export interface CardProps {
    title?: string;
    subtitle?: string;
    content?: string;
    image?: {
        url: string;
        alt?: string;
        position?: 'top' | 'left' | 'right' | 'background';
    };
    actions?: Array<{
        id: string;
        label: string;
        variant?: 'primary' | 'secondary' | 'text';
        icon?: string;
    }>;
    metadata?: Record<string, any>;
}

export const CardComponent: ComponentDefinition = {
    name: 'card',
    render: (props: CardProps, container: HTMLElement) => {
        const wrapper = createComponentWrapper('card');
        wrapper.className += ' card';

        let html = '<div class="card-inner">';

        // Image
        if (props.image) {
            const position = props.image.position || 'top';
            html += `
        <div class="card-image card-image-${position}">
          <img src="${props.image.url}" alt="${props.image.alt || ''}" />
        </div>
      `;
        }

        // Content
        html += '<div class="card-content">';

        if (props.title) {
            html += `<h3 class="card-title">${escapeHtml(props.title)}</h3>`;
        }

        if (props.subtitle) {
            html += `<p class="card-subtitle">${escapeHtml(props.subtitle)}</p>`;
        }

        if (props.content) {
            html += `<div class="card-body">${escapeHtml(props.content)}</div>`;
        }

        html += '</div>'; // card-content

        // Actions
        if (props.actions && props.actions.length > 0) {
            html += '<div class="card-actions">';
            props.actions.forEach((action) => {
                const variant = action.variant || 'text';
                html += `
          <button class="card-action card-action-${variant}" data-action-id="${action.id}">
            ${action.icon ? `<span class="icon">${action.icon}</span>` : ''}
            ${escapeHtml(action.label)}
          </button>
        `;
            });
            html += '</div>';
        }

        html += '</div>'; // card-inner

        wrapper.innerHTML = html;
        container.appendChild(wrapper);

        // Add event listeners for actions
        const actionButtons = wrapper.querySelectorAll('[data-action-id]');
        actionButtons.forEach((button) => {
            button.addEventListener('click', (e) => {
                const actionId = (e.currentTarget as HTMLElement).getAttribute('data-action-id');
                if (actionId) {
                    // Dispatch custom event for action
                    wrapper.dispatchEvent(
                        new CustomEvent('chameleon:action', {
                            detail: { actionId, props },
                            bubbles: true,
                        })
                    );
                }
            });
        });

        return {
            element: wrapper,
            update: (newProps: CardProps) => {
                // Simple update: re-render
                wrapper.innerHTML = '';
                const updated = CardComponent.render(newProps, wrapper);
                return updated;
            },
            destroy: () => {
                // Cleanup event listeners
                actionButtons.forEach((button) => {
                    button.replaceWith(button.cloneNode(true));
                });
            },
        };
    },
};

function escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
