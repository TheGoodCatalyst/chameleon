/**
 * Form Component - Dynamic form builder
 */

import { ComponentDefinition, createComponentWrapper } from '../core/component-registry';

export interface FormField {
    id: string;
    label: string;
    type: 'text' | 'email' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'textarea';
    placeholder?: string;
    required?: boolean;
    default_value?: any;
    options?: Array<{ value: any; label: string }>;
    validation?: {
        pattern?: string;
        min?: number;
        max?: number;
        min_length?: number;
        max_length?: number;
        custom_message?: string;
    };
}

export interface FormProps {
    title?: string;
    description?: string;
    fields: FormField[];
    submit_label?: string;
    cancel_label?: string;
}

export const FormComponent: ComponentDefinition = {
    name: 'form',
    render: (props: FormProps, container: HTMLElement) => {
        const wrapper = createComponentWrapper('form');
        wrapper.className += ' form';

        const form = document.createElement('form');
        form.className = 'form-inner';
        form.noValidate = true;

        // Title
        if (props.title) {
            const title = document.createElement('h3');
            title.className = 'form-title';
            title.textContent = props.title;
            form.appendChild(title);
        }

        // Description
        if (props.description) {
            const desc = document.createElement('p');
            desc.className = 'form-description';
            desc.textContent = props.description;
            form.appendChild(desc);
        }

        // Fields
        const fieldsContainer = document.createElement('div');
        fieldsContainer.className = 'form-fields';

        props.fields.forEach((field) => {
            const fieldGroup = createFormField(field);
            fieldsContainer.appendChild(fieldGroup);
        });

        form.appendChild(fieldsContainer);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'form-actions';

        const submitBtn = document.createElement('button');
        submitBtn.type = 'submit';
        submitBtn.className = 'form-button form-button-primary';
        submitBtn.textContent = props.submit_label || 'Submit';
        actions.appendChild(submitBtn);

        if (props.cancel_label) {
            const cancelBtn = document.createElement('button');
            cancelBtn.type = 'button';
            cancelBtn.className = 'form-button form-button-secondary';
            cancelBtn.textContent = props.cancel_label;
            cancelBtn.addEventListener('click', () => {
                wrapper.dispatchEvent(
                    new CustomEvent('chameleon:cancel', {
                        bubbles: true,
                    })
                );
            });
            actions.appendChild(cancelBtn);
        }

        form.appendChild(actions);

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const data: Record<string, any> = {};

            props.fields.forEach((field) => {
                const value = formData.get(field.id);
                data[field.id] = value;
            });

            wrapper.dispatchEvent(
                new CustomEvent('chameleon:submit', {
                    detail: { data },
                    bubbles: true,
                })
            );
        });

        wrapper.appendChild(form);
        container.appendChild(wrapper);

        return {
            element: wrapper,
            update: (newProps: FormProps) => {
                // Re-render form
                wrapper.innerHTML = '';
                return FormComponent.render(newProps, wrapper);
            },
            destroy: () => {
                // Cleanup
            },
        };
    },
};

function createFormField(field: FormField): HTMLElement {
    const group = document.createElement('div');
    group.className = 'form-field';

    const label = document.createElement('label');
    label.className = 'form-label';
    label.htmlFor = field.id;
    label.textContent = field.label;
    if (field.required) {
        const asterisk = document.createElement('span');
        asterisk.className = 'required';
        asterisk.textContent = ' *';
        label.appendChild(asterisk);
    }
    group.appendChild(label);

    let input: HTMLElement;

    switch (field.type) {
        case 'textarea':
            input = document.createElement('textarea');
            (input as HTMLTextAreaElement).name = field.id;
            (input as HTMLTextAreaElement).id = field.id;
            (input as HTMLTextAreaElement).placeholder = field.placeholder || '';
            if (field.default_value) {
                (input as HTMLTextAreaElement).value = field.default_value;
            }
            break;

        case 'select':
            input = document.createElement('select');
            (input as HTMLSelectElement).name = field.id;
            (input as HTMLSelectElement).id = field.id;
            field.options?.forEach((option) => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.label;
                (input as HTMLSelectElement).appendChild(opt);
            });
            break;

        case 'checkbox':
            input = document.createElement('input');
            (input as HTMLInputElement).type = 'checkbox';
            (input as HTMLInputElement).name = field.id;
            (input as HTMLInputElement).id = field.id;
            if (field.default_value) {
                (input as HTMLInputElement).checked = field.default_value;
            }
            break;

        default:
            input = document.createElement('input');
            (input as HTMLInputElement).type = field.type;
            (input as HTMLInputElement).name = field.id;
            (input as HTMLInputElement).id = field.id;
            (input as HTMLInputElement).placeholder = field.placeholder || '';
            if (field.default_value) {
                (input as HTMLInputElement).value = field.default_value;
            }

            // Validation attributes
            if (field.required) {
                (input as HTMLInputElement).required = true;
            }
            if (field.validation?.pattern) {
                (input as HTMLInputElement).pattern = field.validation.pattern;
            }
            if (field.validation?.min !== undefined) {
                (input as HTMLInputElement).min = String(field.validation.min);
            }
            if (field.validation?.max !== undefined) {
                (input as HTMLInputElement).max = String(field.validation.max);
            }
            if (field.validation?.min_length) {
                (input as HTMLInputElement).minLength = field.validation.min_length;
            }
            if (field.validation?.max_length) {
                (input as HTMLInputElement).maxLength = field.validation.max_length;
            }
            break;
    }

    input.className = 'form-input';
    group.appendChild(input);

    return group;
}
