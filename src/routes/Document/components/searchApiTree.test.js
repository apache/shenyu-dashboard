import { updateTreeNodes } from "./searchApiTree";

describe("updateTreeNodes", () => {
  it("updates an API nested below multiple tag levels", () => {
    const tree = [
      {
        id: "root",
        children: [
          {
            id: "child",
            children: [{ id: "api", title: "old" }],
          },
        ],
      },
    ];

    const result = updateTreeNodes(tree, "api", "new");

    expect(result.updated).toBe(true);
    expect(result.nodes[0].children[0].children[0].title).toBe("new");
    expect(tree[0].children[0].children[0].title).toBe("old");
  });

  it("reports when the tree does not contain the requested node", () => {
    const result = updateTreeNodes([{ id: "root" }], "missing", "new");

    expect(result.updated).toBe(false);
    expect(result.nodes).toEqual([{ id: "root" }]);
  });
});
