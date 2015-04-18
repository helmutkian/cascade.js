# cascade.js
Configurable object graph traversal library for BreezeJs including client-side cascading delete &amp; deep copy.

## How it works

Cascade.js uses the pattern of *principle-dependent* relationships between an entity and its properties for traversing the object graph. The *dependent* of a relationship holds a foreign key to the *principle*. When the ``cascade`` function is called on an entity, it first executes the ``pre`` callback before to visiting any of the entity's dependent properties. The ``cascade`` function is then recursively called on each entity in its dependent properties. After every dependent has been visited, the ``post`` callback is executed. 

However, object graphs often do not have a tree-like structure and contain cycles, or certain entities may require different pre- & post-traversal behavior. Therefore, the ``cascade`` function takes in a configuration object that allows the user to override the traversal of specific dependent properties, either to ignore and not recursively call ``cascade`` on it or to execute different behavior all together. In additon, each entity type may specify its own ``pre`` & ``post`` callbacks that will be excuted in place of the default action.
