import React from 'react';
import PropTypes from 'prop-types';
import { components, OptionProps, GroupBase } from 'react-select';

const CustomOption = (props: OptionProps<unknown, boolean, GroupBase<unknown>>) => {
  const { children, innerProps, ...rest } = props;
  // remove React Select's mouse handlers that can interfere with custom behavior
  const { onMouseMove, onMouseOver, ...innerRest } = innerProps || {};
  const newProps = { ...rest, innerProps: innerRest as typeof innerProps } as OptionProps<
    unknown,
    boolean,
    GroupBase<unknown>
  >;

  return (
    <components.Option {...newProps}>
      {children}
    </components.Option>
  );
};

CustomOption.propTypes = {
  innerProps: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired
};

export default CustomOption;