; 捕获命名空间定义
(
  (namespace_declaration
    name: (qualified_name) @namespace.name
    body: (namespace_body) @namespace.body
  )
)

; 捕获类定义
(
  (class_declaration
    name: (identifier) @class.name
    body: (class_body) @class.body
  )
)

; 捕获结构体定义
(
  (struct_declaration
    name: (identifier) @struct.name
    body: (struct_body) @struct.body
  )
)

; 捕获接口定义
(
  (interface_declaration
    name: (identifier) @interface.name
    body: (interface_body) @interface.body
  )
)

; 捕获枚举定义
(
  (enum_declaration
    name: (identifier) @enum.name
    body: (enum_body) @enum.body
  )
)

; 捕获委托定义
(
  (delegate_declaration
    name: (identifier) @delegate.name
  )
)

; 捕获方法定义
(
  (method_declaration
    name: (identifier) @method.name
    body: (block) @method.body
  )
)

; 捕获属性定义
(
  (property_declaration
    name: (identifier) @property.name
    accessor_list: (accessor_list) @property.accessor_list
  )
)

; 捕获字段定义
(
  (field_declaration
    declarators: (variable_declarator
      name: (identifier) @field.name
    )
  )
)

; 捕获事件定义
(
  (event_declaration
    name: (identifier) @event.name
  )
)

; 捕获构造函数定义
(
  (constructor_declaration
    name: (identifier) @constructor.name
    body: (block) @constructor.body
  )
)

; 捕获析构函数定义
(
  (destructor_declaration
    name: (identifier) @destructor.name
    body: (block) @destructor.body
  )
)